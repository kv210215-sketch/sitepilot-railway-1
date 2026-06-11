import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { bearer } from './auth';
import { waitFor } from './assertions';

const PREFIX = '/api/v1';

// Page lifecycle statuses (mirror src/modules/pages/page.entity PageStatus values).
export type PageStatusValue =
  | 'draft' | 'generated' | 'ready' | 'published' | 'archived' | 'scheduled';

// Terminal publish-job statuses (mirror src/modules/publish PublishStatus values).
const TERMINAL_PUBLISH_STATUSES = ['success', 'failed', 'cancelled'] as const;

export interface PageBody {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  path: string | null;
  status: PageStatusValue;
  isHomepage: boolean;
  body: string | null;
  publishedAt: string | null;
}

export interface PublishJobBody {
  id: string;
  projectId: string;
  scope: string;
  status: string;
  pagesTotal: number;
  pagesSuccess: number;
  pagesFailed: number;
}

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

/**
 * Creates a page under a project via the standalone POST /pages route
 * (projectId travels in the body). Page starts in `draft` status.
 */
export async function createPage(
  app: INestApplication,
  token: string,
  projectId: string,
  overrides: Partial<{ title: string; slug: string; path: string; isHomepage: boolean }> = {},
): Promise<PageBody> {
  const ts = Date.now();
  const rnd = Math.floor((ts % 100000));
  const res = await request(app.getHttpServer())
    .post(`${PREFIX}/pages`)
    .set(...bearer(token))
    .send({
      projectId,
      title: overrides.title ?? `E2E Page ${ts}`,
      slug: overrides.slug ?? `e2e-page-${rnd}`,
      ...(overrides.path ? { path: overrides.path } : {}),
      ...(overrides.isHomepage !== undefined ? { isHomepage: overrides.isHomepage } : {}),
    })
    .expect(201);
  return res.body;
}

/**
 * Creates a page and transitions it to `ready` so it becomes publishable.
 * Optionally sets a body. Returns the updated page.
 */
export async function createReadyPage(
  app: INestApplication,
  token: string,
  projectId: string,
  overrides: Partial<{ title: string; slug: string; path: string; isHomepage: boolean; body: string }> = {},
): Promise<PageBody> {
  const page = await createPage(app, token, projectId, overrides);
  const res = await request(app.getHttpServer())
    .patch(`${PREFIX}/pages/${page.id}`)
    .set(...bearer(token))
    .send({
      status: 'ready',
      body: overrides.body ?? '<h1>E2E ready page</h1>',
    })
    .expect(200);
  return res.body;
}

/**
 * Starts a publish job and polls it (bounded) until it reaches a terminal
 * status. Returns the final job body. No arbitrary fixed sleeps.
 */
export async function publishAndWait(
  app: INestApplication,
  token: string,
  projectId: string,
  opts: { scope?: 'project' | 'page' | 'selected'; pageIds?: string[]; timeoutMs?: number } = {},
): Promise<PublishJobBody> {
  const scope = opts.scope ?? 'project';
  const created = await request(app.getHttpServer())
    .post(`${PREFIX}/projects/${projectId}/publish`)
    .set(...bearer(token))
    .send({ scope, ...(opts.pageIds ? { pageIds: opts.pageIds } : {}) })
    .expect(201);

  const jobId = created.body.id as string;

  return waitFor(
    async () => {
      const res = await request(app.getHttpServer())
        .get(`${PREFIX}/projects/${projectId}/publish/${jobId}`)
        .set(...bearer(token))
        .expect(200);
      const job = res.body as PublishJobBody;
      return (TERMINAL_PUBLISH_STATUSES as readonly string[]).includes(job.status)
        ? job
        : undefined;
    },
    { timeoutMs: opts.timeoutMs ?? 15000, intervalMs: 150, label: `publish job ${jobId} terminal status` },
  );
}

/**
 * End-to-end helper: creates a ready page, publishes the project, waits for
 * success, and refetches the now-published page. Returns the published page.
 */
export async function createPublishedPage(
  app: INestApplication,
  token: string,
  projectId: string,
  overrides: Partial<{ title: string; slug: string; path: string; isHomepage: boolean; body: string }> = {},
): Promise<PageBody> {
  const page = await createReadyPage(app, token, projectId, overrides);
  const job = await publishAndWait(app, token, projectId, { scope: 'project' });
  if (job.status !== 'success') {
    throw new Error(`Expected publish job success, got "${job.status}"`);
  }
  const res = await request(app.getHttpServer())
    .get(`${PREFIX}/pages/${page.id}`)
    .set(...bearer(token))
    .expect(200);
  return res.body;
}
