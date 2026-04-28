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

export enum PageType {
  PAGE     = 'page',
  LANDING  = 'landing',
  SERVICE  = 'service',
  CATEGORY = 'category',
  ARTICLE  = 'article',
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
@Index('idx_pages_project_slug', ['projectId', 'slug'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_pages_project_path', ['projectId', 'path'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // в”Ђв”Ђ Project scope в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  @Index()
  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // в”Ђв”Ђ Core fields в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string | null;

  @Column({ length: 300 })
  title: string;

  @Column({ length: 300 })
  slug: string;

  // path: normalized URL path, e.g. /solar-panels/lviv
  @Column({ name: 'path', type: 'varchar', length: 500, nullable: true })
  path: string | null;

  @Column({
    name: 'page_type',
    type: 'enum',
    enum: PageType,
    default: PageType.PAGE,
  })
  pageType: PageType;

  @Column({ type: 'enum', enum: PageStatus, default: PageStatus.DRAFT })
  status: PageStatus;

  @Column({ name: 'is_homepage', default: false })
  isHomepage: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  // в”Ђв”Ђ Content fields в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  @Column({ type: 'text', nullable: true })
  h1: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  // Structured block content (visual builder / AI generation)
  @Column({ type: 'jsonb', default: { blocks: [] } })
  content: PageContent;

  @Column({ name: 'preview_html', type: 'text', nullable: true })
  previewHtml: string | null;

  // в”Ђв”Ђ SEO fields в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  // metaTitle / metaDescription: manually set by user (takes precedence)
  @Column({ name: 'meta_title', type: 'varchar', length: 300, nullable: true })
  metaTitle: string | null;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string | null;

  // seoTitle / seoDescription: auto-generated (fallback)
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

  // robots: legacy string field (kept for backwards compatibility with Sprint 2)
  @Column({ length: 100, default: 'index, follow' })
  robots: string;

  // robotsIndex / robotsFollow: explicit boolean fields (Stage 5+)
  @Column({ name: 'robots_index', default: true })
  robotsIndex: boolean;

  @Column({ name: 'robots_follow', default: true })
  robotsFollow: boolean;

  @Column({ name: 'structured_data', type: 'jsonb', default: {} })
  structuredData: Record<string, unknown>;

  // в”Ђв”Ђ Hierarchy в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  // в”Ђв”Ђ Authorship в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // в”Ђв”Ђ Timestamps в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}

