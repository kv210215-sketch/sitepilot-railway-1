import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { uniqueEmail, QA_PASSWORD } from './utils/auth';

const PREFIX = '/api/v1';

/**
 * Global rate-limiting coverage (PR #24):
 *   - THROTTLE_LIMIT actually controls the @Throttle(throttle(fraction))
 *     budgets — limits resolve lazily per request, not at decorator import.
 *   - per-client buckets behind a trusted proxy: with `trust proxy` = 1 the
 *     tracker is the X-Forwarded-For client IP, so one abusive client being
 *     throttled does not block other clients (Railway proxy scenario).
 *   - no regression: normal auth bursts under the default e2e budget pass.
 *
 * THROTTLE_LIMIT is mutated per describe-block and restored afterwards —
 * limits are read per request, so the running app picks the value up without
 * a reboot, but each block still boots its own app to get fresh buckets.
 */
describe('Rate limiting (e2e)', () => {
  describe('THROTTLE_LIMIT is honored (scaled @Throttle budgets)', () => {
    let app: INestApplication;
    let prevLimit: string | undefined;

    beforeAll(async () => {
      prevLimit = process.env.THROTTLE_LIMIT;
      // login/register use throttle(0.1) → ceil(20 * 0.1) = 2 requests / TTL.
      process.env.THROTTLE_LIMIT = '20';
      app = await createTestApp();
      await resetDb(app);
    });

    afterAll(async () => {
      process.env.THROTTLE_LIMIT = prevLimit;
      await app.close();
    });

    it('returns 429 once the scaled login budget is exhausted', async () => {
      const ip = '203.0.113.10';
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(`${PREFIX}/auth/login`)
          .set('X-Forwarded-For', ip)
          .send({ email: 'nobody@e2e.test', password: QA_PASSWORD })
          .expect(401); // wrong creds — but each attempt consumes budget
      }

      await request(app.getHttpServer())
        .post(`${PREFIX}/auth/login`)
        .set('X-Forwarded-For', ip)
        .send({ email: 'nobody@e2e.test', password: QA_PASSWORD })
        .expect(429);
    });

    it('tracks clients by X-Forwarded-For IP — one throttled client does not block others', async () => {
      const throttledIp = '203.0.113.20';
      const otherIp = '203.0.113.21';

      // Exhaust the budget for one client IP.
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(`${PREFIX}/auth/login`)
          .set('X-Forwarded-For', throttledIp)
          .send({ email: 'nobody@e2e.test', password: QA_PASSWORD })
          .expect(401);
      }
      await request(app.getHttpServer())
        .post(`${PREFIX}/auth/login`)
        .set('X-Forwarded-For', throttledIp)
        .send({ email: 'nobody@e2e.test', password: QA_PASSWORD })
        .expect(429);

      // A different client IP (same socket = same proxy) is NOT throttled.
      await request(app.getHttpServer())
        .post(`${PREFIX}/auth/login`)
        .set('X-Forwarded-For', otherIp)
        .send({ email: 'nobody@e2e.test', password: QA_PASSWORD })
        .expect(401);
    });

    it('requests without X-Forwarded-For still work (socket IP fallback)', async () => {
      const res = await request(app.getHttpServer())
        .post(`${PREFIX}/auth/login`)
        .send({ email: 'nobody@e2e.test', password: QA_PASSWORD });
      // 401 (bad creds, counted) — never a 5xx from a missing tracker.
      expect(res.status).toBe(401);
    });
  });

  describe('no regression under the default e2e budget', () => {
    let app: INestApplication;

    beforeAll(async () => {
      // setup-env default: THROTTLE_LIMIT=100000 → login budget 10000.
      app = await createTestApp();
      await resetDb(app);
    });

    afterAll(async () => {
      await app.close();
    });

    it('normal register + repeated logins are not throttled', async () => {
      const email = uniqueEmail('throttle');

      await request(app.getHttpServer())
        .post(`${PREFIX}/auth/register`)
        .send({ email, password: QA_PASSWORD, name: 'E2E QA' })
        .expect(201);

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post(`${PREFIX}/auth/login`)
          .send({ email, password: QA_PASSWORD })
          .expect(200);
      }
    });
  });
});
