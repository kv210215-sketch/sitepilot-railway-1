import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { bearer } from './auth';

const PREFIX = '/api/v1';

/** Creates an organization (the caller becomes OWNER). Returns the org body. */
export async function createOrganization(
  app: INestApplication,
  token: string,
  name = `E2E Org ${Date.now()}`,
): Promise<{ id: string; name: string }> {
  const res = await request(app.getHttpServer())
    .post(`${PREFIX}/organizations`)
    .set(...bearer(token))
    .send({ name })
    .expect(201);
  return res.body;
}

/** Creates a project under an organization. Returns the project body. */
export async function createProject(
  app: INestApplication,
  token: string,
  organizationId: string,
  overrides: Partial<{ name: string; slug: string }> = {},
): Promise<{ id: string; slug: string; name: string }> {
  const ts = Date.now();
  const res = await request(app.getHttpServer())
    .post(`${PREFIX}/projects`)
    .set(...bearer(token))
    .send({
      name: overrides.name ?? `E2E Project ${ts}`,
      organizationId,
      slug: overrides.slug ?? `e2e-project-${ts}`,
    })
    .expect(201);
  return res.body;
}
