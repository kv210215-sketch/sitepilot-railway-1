import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import {
  createOrganization, createProject, createPage,
  createReadyPage, publishAndWait,
} from './utils/factories';
import { assertPaginatedShape } from './utils/assertions';

const PREFIX = '/api/v1';

/**
 * P0 publish coverage: the publishable-pages guard, a ready-page publish that
 * completes successfully, page status transition, the paginated jobs list
 * (the orderBy path that previously threw a `databaseName` TypeError), and
 * repeatability. Job completion is awaited with bounded polling — no fixed
 * sleeps.
 */
describe('Publish (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  async function setupProject() {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id);
    return { ...auth, org, project };
  }

  it('rejects publishing a draft-only project with 400 "No publishable pages found"', async () => {
    const { token, project } = await setupProject();
    await createPage(app, token, project.id); // stays in draft

    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/projects/${project.id}/publish`)
      .set(...bearer(token))
      .send({ scope: 'project' })
      .expect(400);

    expect(JSON.stringify(res.body)).toContain('No publishable pages found');
  });

  it('publishes a ready page (201), completes success, and marks the page published', async () => {
    const { token, project } = await setupProject();
    const page = await createReadyPage(app, token, project.id);

    // POST returns 201 with a queued/processing job.
    const created = await request(app.getHttpServer())
      .post(`${PREFIX}/projects/${project.id}/publish`)
      .set(...bearer(token))
      .send({ scope: 'project' })
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        projectId: project.id,
        scope: 'project',
        pagesTotal: 1,
      }),
    );

    // Poll the job until it reaches success.
    const job = await publishAndWaitForJob(app, token, project.id, created.body.id);
    expect(job.status).toBe('success');
    expect(job.pagesSuccess).toBe(1);
    expect(job.pagesFailed).toBe(0);

    // The page is now published.
    const refetched = await request(app.getHttpServer())
      .get(`${PREFIX}/pages/${page.id}`)
      .set(...bearer(token))
      .expect(200);
    expect(refetched.body.status).toBe('published');
    expect(refetched.body.publishedAt).not.toBeNull();
  });

  it('GET /projects/:projectId/publish returns a 200 paginated list including the job', async () => {
    const { token, project } = await setupProject();
    await createReadyPage(app, token, project.id);
    const job = await publishAndWait(app, token, project.id, { scope: 'project' });

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/publish`)
      .set(...bearer(token))
      .expect(200);

    assertPaginatedShape(res.body);
    expect(res.body.data.map((j: { id: string }) => j.id)).toContain(job.id);
  });

  it('publish jobs list with status filter + pagination does not throw (databaseName regression)', async () => {
    const { token, project } = await setupProject();
    await createReadyPage(app, token, project.id);
    await publishAndWait(app, token, project.id, { scope: 'project' });

    // Exercises the ordered, relation-joined query that previously surfaced
    // the `Cannot read properties of undefined (reading 'databaseName')` 500.
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/publish?status=success&page=1&limit=10`)
      .set(...bearer(token))
      .expect(200);

    assertPaginatedShape(res.body);
    expect(res.body.data.every((j: { status: string }) => j.status === 'success')).toBe(true);
  });

  it('repeated ready-page publishes all succeed (no random failures)', async () => {
    const { token, project } = await setupProject();

    for (let i = 0; i < 3; i++) {
      await createReadyPage(app, token, project.id, { title: `Repeat Page ${i}` });
      const job = await publishAndWait(app, token, project.id, { scope: 'project' });
      expect(job.status).toBe('success');
      expect(job.pagesFailed).toBe(0);
    }
  });
});

/** Local poll helper that reuses the bounded waiter against a known job id. */
async function publishAndWaitForJob(
  app: INestApplication,
  token: string,
  projectId: string,
  jobId: string,
) {
  const terminal = ['success', 'failed', 'cancelled'];
  const deadline = Date.now() + 15000;
  for (;;) {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${projectId}/publish/${jobId}`)
      .set(...bearer(token))
      .expect(200);
    if (terminal.includes(res.body.status)) return res.body;
    if (Date.now() >= deadline) {
      throw new Error(`publish job ${jobId} did not finish in time`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}
