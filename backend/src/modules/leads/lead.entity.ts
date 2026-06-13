import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Project } from '../projects/project.entity';

export enum LeadStatus {
  NEW       = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  ARCHIVED  = 'archived',
  SPAM      = 'spam',
}

/**
 * A lead captured from a published site's contact / CTA form.
 *
 * Ingested unauthenticated via POST /public/v1/leads (per project), read back
 * by org members via GET /api/v1/projects/:projectId/leads. PII — never exposed
 * on any public route.
 */
@Entity('leads')
// Dashboard lists leads newest-first within a project.
@Index('idx_leads_project_created', ['projectId', 'createdAt'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Scope ────────────────────────────────────────────────────────────────────
  // projectId is the access scope: access is granted via the project's org
  // membership (ProjectAccessGuard), mirroring pages/publish.

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // Page the lead was submitted from (optional — forms may be project-wide).
  @Column({ name: 'page_id', type: 'uuid', nullable: true })
  pageId: string | null;

  // ── Contact details ────────────────────────────────────────────────────────────

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  // ── Provenance ──────────────────────────────────────────────────────────────────

  // Where the form lived (URL path on the published site).
  @Column({ name: 'page_path', type: 'varchar', length: 500, nullable: true })
  pagePath: string | null;

  // Logical origin of the lead (public_form, api, import, ...).
  @Column({ type: 'varchar', length: 50, default: 'public_form' })
  source: string;

  @Column({ name: 'consent', type: 'boolean', default: false })
  consent: boolean;

  // utm params, referrer, userAgent, etc.
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Index()
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  // Collected for anti-spam / abuse tracing only — never serialized to API
  // responses (see LeadResponseDto).
  @Exclude()
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  // ── Timestamps ──────────────────────────────────────────────────────────────────

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
