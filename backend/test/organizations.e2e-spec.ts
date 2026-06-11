import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import { createOrganization } from './utils/factories';
import { assertPaginatedShape } from './utils/assertions';

const PREFIX = '/api/v1';

/**
 * P0 organizations coverage: create, response shape, owner membership
 * (exposed via the members endpoint), list, and the unauthorized path.
 */
describe('Organizations (e2e)', () => {
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

  it('POST /organizations returns 201 with id, name, slug, ownerId', async () => {
    const { token, userId } = await registerAndLogin(app);

    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/organizations`)
      .set(...bearer(token))
      .send({ name: 'E2E Org Create' })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'E2E Org Create',
        slug: expect.any(String),
        ownerId: userId,
        isActive: true,
      }),
    );
  });

  it('creator is registered as an active OWNER member', async () => {
    const { token, userId } = await registerAndLogin(app);
    const org = await createOrganization(app, token, 'E2E Org Members');

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/organizations/${org.id}/members`)
      .set(...bearer(token))
      .expect(200);

    assertPaginatedShape(res.body);
    const owner = res.body.data.find(
      (m: { userId: string }) => m.userId === userId,
    );
    expect(owner).toBeDefined();
    expect(owner).toEqual(
      expect.objectContaining({ userId, role: 'owner', isActive: true }),
    );
  });

  it('GET /organizations returns the created org', async () => {
    const { token } = await registerAndLogin(app);
    const org = await createOrganization(app, token, 'E2E Org List');

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/organizations`)
      .set(...bearer(token))
      .expect(200);

    assertPaginatedShape(res.body);
    expect(res.body.data.map((o: { id: string }) => o.id)).toContain(org.id);
  });

  it('GET /organizations without a token returns 401', async () => {
    await request(app.getHttpServer()).get(`${PREFIX}/organizations`).expect(401);
  });

  it('POST /organizations without a token returns 401', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/organizations`)
      .send({ name: 'Unauthorized Org' })
      .expect(401);
  });
});
