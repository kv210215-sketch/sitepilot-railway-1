import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import {
  createOrganization, createProject, createReadyPage, publishAndWait,
} from './utils/factories';

const PREFIX = '/api/v1';

/**
 * Global dashboard endpoints consumed by frontend /dashboard:
 *   GET /analytics/dashboard — aggregate stats over the user's org projects
 *   GET /activity            — the user's global activity feed
 *   GET /publish/queue       — recent publish jobs across the user's projects
 *
 * All three previously did not exist (the dashboard 404'd and fell back to
 * mock data). Each must be scoped to the requesting user's organizations —
 * a second user with no shared org must see empty/zero data, never another
 * tenant's.
 */
describe('Dashboard endpoints (e2e)', () => {
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

  it('GET /analytics/dashboard returns aggregate stats for the user projects', async () => {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id);
    await createReadyPage(app, auth.token, project.id);
    const job = await publishAndWait(app, auth.token, project.id, { scope: 'project' });
    expect(job.status).toBe('success');

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/analytics/dashboard`)
      .set(...bearer(auth.token))
      .expect(200);

    expect(res.body.projectsTotal).toBe(1);
    expect(res.body.pagesTotal).toBe(1);
    expect(res.body.publishTotal).toBe(1);
    expect(res.body.publishSuccess).toBe(1);
    expect(res.body.errorsTotal).toBe(0);
    expect(typeof res.body.publishAvgMs).toBe('number');
  });

  it('GET /activity returns the global feed with project names', async () => {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id);
    await createReadyPage(app, auth.token, project.id);
    await publishAndWait(app, auth.token, project.id, { scope: 'project' });

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/activity?limit=6`)
      .set(...bearer(auth.token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.length).toBeLessThanOrEqual(6);

    const entry = res.body.find(
      (e: { action: string }) => e.action === 'publish_success',
    );
    expect(entry).toBeDefined();
    expect(entry.userName).toBe('E2E QA');
    expect(entry.projectName).toBe(project.name);
    expect(entry.createdAt).toBeDefined();
  });

  it('GET /publish/queue returns recent jobs with project names', async () => {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id);
    await createReadyPage(app, auth.token, project.id);
    await publishAndWait(app, auth.token, project.id, { scope: 'project' });

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/publish/queue?limit=4`)
      .set(...bearer(auth.token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const jobItem = res.body[0];
    expect(jobItem.status).toBe('success');
    expect(jobItem.scope).toBe('project');
    expect(jobItem.pagesTotal).toBe(1);
    expect(jobItem.pagesSuccess).toBe(1);
    expect(jobItem.projectName).toBe(project.name);
  });

  it('scopes all three endpoints per user — a stranger sees no tenant data', async () => {
    const owner = await registerAndLogin(app);
    const org = await createOrganization(app, owner.token);
    const project = await createProject(app, owner.token, org.id);
    await createReadyPage(app, owner.token, project.id);
    await publishAndWait(app, owner.token, project.id, { scope: 'project' });

    const stranger = await registerAndLogin(app);

    const stats = await request(app.getHttpServer())
      .get(`${PREFIX}/analytics/dashboard`)
      .set(...bearer(stranger.token))
      .expect(200);
    expect(stats.body.projectsTotal).toBe(0);
    expect(stats.body.publishTotal).toBe(0);

    const feed = await request(app.getHttpServer())
      .get(`${PREFIX}/activity`)
      .set(...bearer(stranger.token))
      .expect(200);
    expect(feed.body).toEqual([]);

    const queue = await request(app.getHttpServer())
      .get(`${PREFIX}/publish/queue`)
      .set(...bearer(stranger.token))
      .expect(200);
    expect(queue.body).toEqual([]);
  });

  it('rejects unauthenticated access to all three endpoints', async () => {
    for (const path of ['/analytics/dashboard', '/activity', '/publish/queue']) {
      await request(app.getHttpServer()).get(`${PREFIX}${path}`).expect(401);
    }
  });
});
