import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { createTestApp } from './utils/app';
import { resetDb } from './utils/db';
import { registerAndLogin } from './utils/auth';
import { createOrganization, createProject } from './utils/factories';
import { waitFor } from './utils/assertions';
import { MailService } from '../src/modules/mail/mail.service';

const PREFIX = '/api/v1';
// Public lead ingest is excluded from the global api/v1 prefix (see main.ts).
const PUBLIC = '/public/v1';

/**
 * Stage 13 — Lead Capture MVP.
 * Visitor → POST /public/v1/leads (no auth) → stored → visible to org members
 * via GET /api/v1/projects/:projectId/leads → owner notified (MailService).
 */
describe('Lead capture (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(app);
    jest.restoreAllMocks();
  });

  async function setupOwnerProject() {
    const owner = await registerAndLogin(app);
    const org = await createOrganization(app, owner.token);
    const project = await createProject(app, owner.token, org.id);
    return { owner, org, project };
  }

  it('public visitor can submit a lead (201) without auth', async () => {
    const { project } = await setupOwnerProject();

    const res = await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({
        projectId: project.id,
        name: 'Олена Коваль',
        email: 'olena@example.com',
        phone: '+380671234567',
        message: 'Цікавить СЕС 10 кВт',
        pagePath: '/contact',
      })
      .expect(201);

    expect(res.body.received).toBe(true);
    expect(typeof res.body.id).toBe('string');
  });

  it('stored lead is visible via the dashboard API to the owner', async () => {
    const { owner, project } = await setupOwnerProject();

    await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({ projectId: project.id, name: 'Ivan Petrenko', phone: '+380501112233' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/leads`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(list.body.total).toBe(1);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data[0]).toEqual(
      expect.objectContaining({
        name: 'Ivan Petrenko',
        phone: '+380501112233',
        status: 'new',
        source: 'public_form',
        projectId: project.id,
      }),
    );

    // ipAddress is PII collected for anti-spam — must not reach org members.
    expect(list.body.data[0]).not.toHaveProperty('ipAddress');
    expect(list.body.data[0]).not.toHaveProperty('deletedAt');

    // Detail endpoint
    const leadId = list.body.data[0].id;
    const detail = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/leads/${leadId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(detail.body.id).toBe(leadId);
    expect(detail.body).not.toHaveProperty('ipAddress');
    expect(detail.body).not.toHaveProperty('deletedAt');
  });

  it('owner receives a notification (MailService called with owner email)', async () => {
    const { owner, project } = await setupOwnerProject();

    const mail = app.get(MailService);
    const spy = jest.spyOn(mail, 'sendMail');

    await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({ projectId: project.id, name: 'Notify Test', email: 'lead@example.com' })
      .expect(201);

    // Notification is fire-and-forget; poll until it lands.
    await waitFor(async () => (spy.mock.calls.length > 0 ? true : undefined), {
      timeoutMs: 5000,
      intervalMs: 100,
      label: 'lead notification dispatched',
    });

    const arg = spy.mock.calls[0][0];
    const recipients = Array.isArray(arg.to) ? arg.to : [arg.to];
    expect(recipients).toContain(owner.email);
    expect(arg.subject).toContain('Notify Test');
  });

  it('rejects a non-member with 403 (access control)', async () => {
    const { project } = await setupOwnerProject();
    const stranger = await registerAndLogin(app);

    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/leads`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(403);
  });

  it('requires auth for the dashboard API (401)', async () => {
    const { project } = await setupOwnerProject();
    await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/leads`)
      .expect(401);
  });

  it('validates input: missing name → 400, no contact channel → 400', async () => {
    const { project } = await setupOwnerProject();

    await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({ projectId: project.id, email: 'x@example.com' }) // no name
      .expect(400);

    await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({ projectId: project.id, name: 'No Contact' }) // no email/phone
      .expect(400);
  });

  it('drops honeypot submissions silently (201, not stored)', async () => {
    const { owner, project } = await setupOwnerProject();

    const res = await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({
        projectId: project.id,
        name: 'Bot',
        email: 'bot@spam.test',
        website: 'http://spam.example', // honeypot filled
      })
      .expect(201);

    expect(res.body.received).toBe(true);
    expect(res.body.id).toBeNull();

    const list = await request(app.getHttpServer())
      .get(`${PREFIX}/projects/${project.id}/leads`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(list.body.total).toBe(0);
  });

  it('returns 404 for an unknown project', async () => {
    await request(app.getHttpServer())
      .post(`${PUBLIC}/leads`)
      .send({
        projectId: '00000000-0000-0000-0000-000000000000',
        name: 'Ghost',
        email: 'ghost@example.com',
      })
      .expect(404);
  });
});
