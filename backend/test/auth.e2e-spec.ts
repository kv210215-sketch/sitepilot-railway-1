import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { uniqueEmail, QA_PASSWORD, bearer, registerAndLogin } from './utils/auth';

const PREFIX = '/api/v1';

/**
 * P0 auth coverage: register / login / me, plus the negative paths
 * (invalid login, weak password, duplicate email). Tokens and passwords
 * are never logged.
 */
describe('Auth (e2e)', () => {
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

  it('POST /auth/register returns 201 with user + tokens', async () => {
    const email = uniqueEmail('register');

    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email, password: QA_PASSWORD, name: 'E2E QA' })
      .expect(201);

    expect(res.body.user).toEqual(
      expect.objectContaining({ id: expect.any(String), email, name: 'E2E QA' }),
    );
    expect(res.body.tokens).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
      }),
    );
  });

  it('POST /auth/login returns 200 with a token structure', async () => {
    const email = uniqueEmail('login');
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email, password: QA_PASSWORD, name: 'E2E QA' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email, password: QA_PASSWORD })
      .expect(200);

    expect(res.body.user).toEqual(expect.objectContaining({ email }));
    expect(res.body.tokens).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
      }),
    );
    expect(typeof res.body.tokens.accessToken).toBe('string');
    expect(res.body.tokens.accessToken.length).toBeGreaterThan(0);
  });

  it('GET /auth/me returns the current user', async () => {
    const { token, userId, email } = await registerAndLogin(app);

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/auth/me`)
      .set(...bearer(token))
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({ id: userId, email, name: expect.any(String) }),
    );
  });

  it('GET /auth/me without a token returns 401', async () => {
    await request(app.getHttpServer()).get(`${PREFIX}/auth/me`).expect(401);
  });

  it('POST /auth/login with wrong password returns 401', async () => {
    const email = uniqueEmail('badlogin');
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email, password: QA_PASSWORD, name: 'E2E QA' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email, password: 'WrongPassw0rd!' })
      .expect(401);
  });

  it('POST /auth/register with a weak password returns 400', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email: uniqueEmail('weak'), password: 'short', name: 'E2E QA' })
      .expect(400);
  });

  it('POST /auth/register with a duplicate email returns 409', async () => {
    const email = uniqueEmail('dup');
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email, password: QA_PASSWORD, name: 'E2E QA' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email, password: QA_PASSWORD, name: 'E2E QA Dup' })
      .expect(409);
  });
});
