import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User }    from '../users/user.entity';

export enum PageStatus {
  DRAFT     = 'draft',
  GENERATED = 'generated',
  READY     = 'ready',
  PUBLISHED = 'published',
  ARCHIVED  = 'archived',
  SCHEDULED = 'scheduled',
}

export interface PageContent {
  blocks: PageBlock[];
}

export interface PageBlock {
  type: 'hero' | 'pain' | 'steps' | 'numbers' | 'audience'
      | 'guarantees' | 'cta' | 'faq' | 'offers' | 'custom';
  order: number;
  data:  Record<string, unknown>;
}

@Entity('pages')
@Index(['projectId', 'slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ length: 300 })
  title: string;

  @Column({ length: 300 })
  slug: string;

  @Column({ name: 'url_path', type: 'varchar', length: 500, nullable: true })
  urlPath: string | null;

  @Column({ type: 'enum', enum: PageStatus, default: PageStatus.DRAFT })
  status: PageStatus;

  // ── Content ─────────────────────────────────────────────────────────────────
  @Column({ type: 'jsonb', default: { blocks: [] } })
  content: PageContent;

  @Column({ name: 'preview_html', type: 'text', nullable: true })
  previewHtml: string | null;

  // ── SEO ──────────────────────────────────────────────────────────────────────
  @Column({ name: 'seo_title', type: 'varchar', length: 300, nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ name: 'seo_keywords', type: 'text', nullable: true })
  seoKeywords: string | null;

  @Column({ name: 'og_title', type: 'varchar', length: 300, nullable: true })
  ogTitle: string | null;

  @Column({ name: 'og_description', type: 'text', nullable: true })
  ogDescription: string | null;

  @Column({ name: 'og_image_url', type: 'varchar', length: 500, nullable: true })
  ogImageUrl: string | null;

  @Column({ name: 'canonical_url', type: 'varchar', length: 500, nullable: true })
  canonicalUrl: string | null;

  @Column({ length: 100, default: 'index, follow' })
  robots: string;

  @Column({ name: 'structured_data', type: 'jsonb', default: {} })
  structuredData: Record<string, unknown>;

  // ── Meta ─────────────────────────────────────────────────────────────────────
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
