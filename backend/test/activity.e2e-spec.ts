import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import {
  createOrganization, createProject, createReadyPage, publishAndWait,
} from './utils/factories';
import { assertPaginatedShape } from './utils/assertions';

const PREFIX = '/api/v1';

/**
 * Activity-feed coverage for GET /projects/:projectId/activity.
 *
 * The success path of this endpoint was never exercised by the committed suite,
 * which is why a regression went unnoticed: AuditService.list() ordered the
 * relation-joined, paginated query by the raw DB column (`a.created_at`). With a
 * leftJoinAndSelect + skip/take, TypeORM uses its distinct-id pagination strategy
 * and resolves the order-by expression against entity metadata — `created_at` is
 * not a property name, so the column metadata was undefined and the request 500'd
 * with `Cannot read properties of undefined (reading 'databaseName')`.
 *
 * These assertions exercise both the empty feed (the crash was at query-build
 * time, so even zero rows reproduced it) and the populated, enriched feed.
 */
describe('Activity (e2e)', () => {
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

  it('GET /projects/:projectId/activity returns 200 with a paginated shape (empty feed)', async () => {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id);

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/activity`)
      .set(...bearer(auth.token))
      .expect(200);

    assertPaginatedShape(res.body);
    expect(res.body.total).toBe(0);
  });

  it('GET /projects/:projectId/activity returns 200 with entries enriched with userName/userEmail', async () => {
    const auth = await registerAndLogin(app);
    const org = await createOrganization(app, auth.token);
    const project = await createProject(app, auth.token, org.id);

    // A publish writes audit entries (publish_started/publish_success) tagged
    // with the initiating user, so the feed has rows to enrich.
    await createReadyPage(app, auth.token, project.id);
    await publishAndWait(app, auth.token, project.id, { scope: 'project' });

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/activity?page=1&limit=50`)
      .set(...bearer(auth.token))
      .expect(200);

    assertPaginatedShape(res.body);
    expect(res.body.total).toBeGreaterThan(0);

    const entry = res.body.data.find(
      (e: { userEmail?: string }) => e.userEmail === auth.email,
    );
    expect(entry).toBeDefined();
    expect(entry.userName).toBe('E2E QA');
    expect(entry.userEmail).toBe(auth.email);
    expect(typeof entry.action).toBe('string');
    expect(entry.createdAt).toBeDefined();
  });
});
