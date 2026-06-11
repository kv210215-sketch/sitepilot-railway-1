import { INestApplication } from '@nestjs/common';
import request = require('supertest');

const PREFIX = '/api/v1';

export interface AuthedUser {
  token: string;
  userId: string;
  email: string;
}

let seq = 0;

/**
 * Registers and logs in a fresh QA user; returns the access token (never logged).
 */
export async function registerAndLogin(app: INestApplication): Promise<AuthedUser> {
  const email = `qa+e2e-${Date.now()}-${seq++}@e2e.test`;
  const password = 'E2ePassw0rd!';

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
