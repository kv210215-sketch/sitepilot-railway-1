import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import { createOrganization, createProject } from './utils/factories';

const PREFIX = '/api/v1';

/**
 * Smoke spec for the e2e harness. The default GET /projects path sorts by
 * createdAt, which is exactly the query that returned HTTP 500 before PR #15
 * (TypeError: ...'databaseName'). These assertions would have caught it.
 */
describe('Projects (e2e)', () => {
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

  it('GET /projects returns 200 with a paginated shape (empty)', async () => {
    const { token } = await registerAndLogin(app);

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects`)
      .set(...bearer(token))
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        totalPages: expect.any(Number),
      }),
    );
    expect(res.body.total).toBe(0);
  });

  it('GET /projects returns the created project after creation', async () => {
    const { token } = await registerAndLogin(app);
    const org = await createOrganization(app, token);
    const project = await createProject(app, token, org.id);

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects`)
      .set(...bearer(token))
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.data.map((p: { id: string }) => p.id)).toContain(project.id);
  });

  it.each(['createdAt', 'updatedAt', 'name'])(
    'GET /projects?orderBy=%s returns 200',
    async (orderBy) => {
      const { token } = await registerAndLogin(app);

      await request(app.getHttpServer())
        .get(`${PREFIX}/projects?orderBy=${orderBy}`)
        .set(...bearer(token))
        .expect(200);
    },
  );
});
