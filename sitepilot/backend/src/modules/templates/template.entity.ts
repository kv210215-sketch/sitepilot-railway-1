// ── template.entity.ts ───────────────────────────────────────────────────────
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User }    from '../users/user.entity';
import { Project } from '../projects/project.entity';

export enum TemplateCategory {
  HOME       = 'home',
  BUSINESS   = 'business',
  POWER      = 'power',
  SEO_CITY   = 'seo_city',
  SEASONAL   = 'seasonal',
  B2B        = 'b2b',
}

export interface TemplateBlockDef {
  type:     string;
  order:    number;
  required: boolean;
  defaults: Record<string, unknown>;
}

export interface TemplateStructure {
  blocks:      TemplateBlockDef[];
  seoRules:    Record<string, unknown>;
  requiredVars: string[];
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', nullable: true })
  projectId: string | null;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'jsonb', default: { blocks: [], seoRules: {}, requiredVars: [] } })
  structure: TemplateStructure;

  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'is_global', default: false })
  isGlobal: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
