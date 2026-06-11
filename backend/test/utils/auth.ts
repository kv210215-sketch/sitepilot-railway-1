import { INestApplication } from '@nestjs/common';
import request = require('supertest');

const PREFIX = '/api/v1';

export interface AuthedUser {
  token: string;
  userId: string;
  email: string;
}

let seq = 0;

/** Strong password used by all QA users (never logged). */
export const QA_PASSWORD = 'E2ePassw0rd!';

/** Returns a unique, lowercase QA email for a single test run. */
export function uniqueEmail(tag = 'e2e'): string {
  return `qa+${tag}-${Date.now()}-${seq++}@e2e.test`;
}

/**
 * Registers and logs in a fresh QA user; returns the access token (never logged).
 */
export async function registerAndLogin(app: INestApplication): Promise<AuthedUser> {
  const email = uniqueEmail();
  const password = QA_PASSWORD;

  const reg = await request(app.getHttpServer())
    .post(`${PREFIX}/auth/register`)
    .send({ email, password, name: 'E2E QA' })
    .expect(201);

  const login = await request(app.getHttpServer())
    .post(`${PREFIX}/auth/login`)
    .send({ email, password })
    .expect(200);

  const token = login.body?.tokens?.accessToken as string;
  const userId = (reg.body?.user?.id ?? login.body?.user?.id) as string;
  return { token, userId, email };
}

/** Bearer auth header helper. */
export function bearer(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}

/**
 * Convenience around supertest that attaches the bearer token for a request.
 * Usage: `await authedRequest(app, token).get('/api/v1/...').expect(200)`.
 */
export function authedRequest(
  app: INestApplication,
  token: string,
): {
  get: (url: string) => request.Test;
  post: (url: string) => request.Test;
  patch: (url: string) => request.Test;
  delete: (url: string) => request.Test;
} {
  const agent = request(app.getHttpServer());
  const auth = (t: request.Test) => t.set(...bearer(token));
  return {
    get: (url) => auth(agent.get(url)),
    post: (url) => auth(agent.post(url)),
    patch: (url) => auth(agent.patch(url)),
    delete: (url) => auth(agent.delete(url)),
  };
}
