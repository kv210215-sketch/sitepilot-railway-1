import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import { createOrganization, createProject, createPage } from './utils/factories';

const PREFIX = '/api/v1';

/**
 * P0 pages coverage: create → edit (title/body/status) → refetch persistence,
 * the validation whitelist (unknown top-level field rejected), and the
 * unauthorized path.
 */
describe('Pages (e2e)', () => {
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

  it('creates a page in draft status', async () => {
    const { token, project } = await setupProject();

    const page = await createPage(app, token, project.id, { title: 'My First Page' });

    expect(page).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        projectId: project.id,
        title: 'My First Page',
        slug: expect.any(String),
        status: 'draft',
      }),
    );
  });

  it('edits title/body/status and persists across a refetch', async () => {
    const { token, project } = await setupProject();
    const page = await createPage(app, token, project.id, { title: 'Original Title' });

    const patched = await request(app.getHttpServer())
      .patch(`${PREFIX}/pages/${page.id}`)
      .set(...bearer(token))
      .send({ title: 'Edited Title', body: '<h1>Edited body</h1>', status: 'ready' })
      .expect(200);

    expect(patched.body).toEqual(
      expect.objectContaining({
        id: page.id,
        title: 'Edited Title',
        body: '<h1>Edited body</h1>',
        status: 'ready',
      }),
    );

    // Refetch confirms persistence (not just the write-response echo).
    const refetched = await request(app.getHttpServer())
      .get(`${PREFIX}/pages/${page.id}`)
      .set(...bearer(token))
      .expect(200);

    expect(refetched.body).toEqual(
      expect.objectContaining({
        id: page.id,
        title: 'Edited Title',
        body: '<h1>Edited body</h1>',
        status: 'ready',
      }),
    );
  });

  it('rejects an unknown top-level field (metaTitle) with 400', async () => {
    const { token, project } = await setupProject();
    const page = await createPage(app, token, project.id);

    // `metaTitle` is only valid nested under `seo` — at the top level the
    // ValidationPipe whitelist (forbidNonWhitelisted) must reject it.
    await request(app.getHttpServer())
      .patch(`${PREFIX}/pages/${page.id}`)
      .set(...bearer(token))
      .send({ metaTitle: 'should be rejected' })
      .expect(400);
  });

  it('GET /pages/:id without a token returns 401', async () => {
    const { token, project } = await setupProject();
    const page = await createPage(app, token, project.id);

    await request(app.getHttpServer())
      .get(`${PREFIX}/pages/${page.id}`)
      .expect(401);
  });

  it('GET /pages (list) without a token returns 401', async () => {
    await request(app.getHttpServer()).get(`${PREFIX}/pages`).expect(401);
  });
});
