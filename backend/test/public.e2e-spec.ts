import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin } from './utils/auth';
import {
  createOrganization, createProject, createPage, createPublishedPage,
} from './utils/factories';

// Public read API is excluded from the global `api/v1` prefix (see main.ts).
const PUBLIC = '/public/v1';

// Matches PUBLIC_DEFAULT_PROJECT_SLUG in test/setup-env.ts so lookups hit the
// configured default project path (production-representative).
const DEFAULT_SLUG = 'solomiya-energy';

/**
 * P0 public render coverage: published page lookup, 404 paths (unknown +
 * unpublished), and the sitemap feed. No JWT (routes are @Public()).
 * PUBLIC_API_ENABLED=true is set by test/setup-env.ts.
 */
describe('Public render (e2e)', () => {
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

  async function setupDefaultProject() {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id, { slug: DEFAULT_SLUG });
    return { ...auth, org, project };
  }

  it('GET /public/v1/pages/<path> returns 200 for a published page', async () => {
    const { token, project } = await setupDefaultProject();
    await createPublishedPage(app, token, project.id, {
      title: 'СЕС 10 кВт у Львові',
      path: '/lviv-ses-10',
    });

    const res = await request(app.getHttpServer())
      .get(`${PUBLIC}/pages/lviv-ses-10`)
      .expect(200);

    expect(res.body.path).toBe('/lviv-ses-10');
    expect(typeof res.body.title).toBe('string');
    expect(res.body.title.length).toBeGreaterThan(0);
    expect(typeof res.body.robotsIndex).toBe('boolean');
    expect(Array.isArray(res.body.blocks)).toBe(true);
    expect(res.body.isHomepage).toBe(false);
  });

  it('GET /public/v1/pages/<unknown> returns 404', async () => {
    await request(app.getHttpServer())
      .get(`${PUBLIC}/pages/no-such-page-xyz`)
      .expect(404);
  });

  it('GET /public/v1/pages/<draft path> returns 404 (not published)', async () => {
    const { token, project } = await setupDefaultProject();
    await createPage(app, token, project.id, { path: '/draft-only-path' }); // stays draft

    await request(app.getHttpServer())
      .get(`${PUBLIC}/pages/draft-only-path`)
      .expect(404);
  });

  it('GET /public/v1/sitemap-entries returns 200 with the published page', async () => {
    const { token, project } = await setupDefaultProject();
    await createPublishedPage(app, token, project.id, {
      title: 'Sitemap Page',
      path: '/sitemap-page',
    });

    const res = await request(app.getHttpServer())
      .get(`${PUBLIC}/sitemap-entries`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const entry = res.body.find((e: { path: string }) => e.path === '/sitemap-page');
    expect(entry).toBeDefined();
    expect(entry).toEqual(
      expect.objectContaining({
        path: '/sitemap-page',
        robotsIndex: expect.any(Boolean),
        isHomepage: false,
      }),
    );
  });

  it('GET /public/v1/sitemap-entries returns 200 (array) when there is nothing published', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PUBLIC}/sitemap-entries`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
