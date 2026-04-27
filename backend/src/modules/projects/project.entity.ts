import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

export enum ProjectType {
  LANDING         = 'landing',
  MULTI_PAGE      = 'multi_page',
  CATALOG         = 'catalog',
  SERVICE_SITE    = 'service_site',
  SOLAR_COMMERCIAL = 'solar_commercial',
}

export enum ProjectStatus {
  DRAFT    = 'draft',
  ACTIVE   = 'active',
  ARCHIVED = 'archived',
  DELETED  = 'deleted',
}

@Entity('projects')
// Slug is unique within an organization (not globally)
@Index('idx_projects_org_slug', ['organizationId', 'slug'], {
  unique: true,
  where: '"organization_id" IS NOT NULL AND "deleted_at" IS NULL',
})
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Organization scope ───────────────────────────────────────────────────────
  // organizationId is the primary access scope.
  // Nullable transitionally (old rows may lack it); in practice must be set.

  @Index()
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  // ── Authorship ───────────────────────────────────────────────────────────────
  // Records who created the project. NOT used for access control.

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User | null;

  // ── Core fields ──────────────────────────────────────────────────────────────

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  // ── Extended metadata ────────────────────────────────────────────────────────

  @Column({
    name: 'project_type',
    type: 'enum',
    enum: ProjectType,
    default: ProjectType.SERVICE_SITE,
  })
  projectType: ProjectType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string | null;

  @Column({ name: 'favicon_url', type: 'varchar', length: 500, nullable: true })
  faviconUrl: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @Column({ name: 'seo_defaults', type: 'jsonb', default: {} })
  seoDefaults: Record<string, unknown>;

  // ── Timestamps ───────────────────────────────────────────────────────────────

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
