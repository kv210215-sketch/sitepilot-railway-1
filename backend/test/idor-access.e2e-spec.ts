import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin, bearer } from './utils/auth';
import { createOrganization, createProject, createReadyPage } from './utils/factories';

const PREFIX = '/api/v1';

/**
 * Cross-tenant IDOR coverage for the project-scoped activity and publish routes.
 *
 * Both controllers were authenticated (JwtAuthGuard) but NOT authorized: any
 * logged-in user could read or trigger actions on another organization's
 * project just by knowing the projectId. ProjectAccessGuard now resolves
 * :projectId → org membership and rejects non-members with 403.
 *
 * "owner" = the member who created the org/project. "outsider" = an unrelated
 * user in a different organization. The leads route already enforced this and
 * is included as a control.
 */
describe('Cross-tenant access control (e2e)', () => {
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

  async function seedProject() {
    const owner = await registerAndLogin(app);
    const org = await createOrganization(app, owner.token);
    const project = await createProject(app, owner.token, org.id);
    // Give the project a page so activity/publish have something to act on.
    await createReadyPage(app, owner.token, project.id);
    return { owner, project };
  }

  it('owner can read project activity (200); outsider is rejected (403)', async () => {
    const { owner, project } = await seedProject();
    const outsider = await registerAndLogin(app);

    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/activity`)
      .set(...bearer(owner.token))
      .expect(200);

    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/activity`)
      .set(...bearer(outsider.token))
      .expect(403);
  });

  it('owner can read project publish queue (200); outsider is rejected (403)', async () => {
    const { owner, project } = await seedProject();
    const outsider = await registerAndLogin(app);

    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/publish`)
      .set(...bearer(owner.token))
      .expect(200);

    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/publish`)
      .set(...bearer(outsider.token))
      .expect(403);
  });

  it('outsider cannot trigger a publish on another tenant project (403)', async () => {
    const { project } = await seedProject();
    const outsider = await registerAndLogin(app);

    await request(app.getHttpServer())
      .post(`${PREFIX}/projects/${project.id}/publish`)
      .set(...bearer(outsider.token))
      .send({ scope: 'project' })
      .expect(403);
  });

  it('control: outsider cannot read another tenant leads (403)', async () => {
    const { project } = await seedProject();
    const outsider = await registerAndLogin(app);

    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/leads`)
      .set(...bearer(outsider.token))
      .expect(403);
  });
});
