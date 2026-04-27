import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User }    from '../users/user.entity';

export enum PublishScope {
  PAGE     = 'page',
  PROJECT  = 'project',
  SELECTED = 'selected',
}

export enum PublishStatus {
  PENDING    = 'pending',
  QUEUED     = 'queued',
  PROCESSING = 'processing',
  SUCCESS    = 'success',
  FAILED     = 'failed',
  CANCELLED  = 'cancelled',
  RETRYING   = 'retrying',
}

@Entity('publish_jobs')
export class PublishJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'initiated_by', type: 'uuid', nullable: true })
  initiatedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'initiated_by' })
  initiator: User;

  @Column({ type: 'enum', enum: PublishScope })
  scope: PublishScope;

  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.PENDING })
  status: PublishStatus;

  @Column({ name: 'page_ids', type: 'uuid', array: true, default: [] })
  pageIds: string[];

  @Column({ name: 'pages_total',   default: 0 })
  pagesTotal: number;

  @Column({ name: 'pages_success', default: 0 })
  pagesSuccess: number;

  @Column({ name: 'pages_failed',  default: 0 })
  pagesFailed: number;

  @Column({ default: 1 })
  attempt: number;

  @Column({ name: 'max_attempts', default: 3 })
  maxAttempts: number;

  @Column({ default: 5 })
  priority: number;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  result: Record<string, unknown>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt: Date | null;

  @Column({ name: 'queued_at', type: 'timestamptz', default: () => 'NOW()' })
  queuedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => PublishJobLog, l => l.job, { cascade: false })
  logs: PublishJobLog[];
}

// ── publish_job_logs ──────────────────────────────────────────────────────────

@Entity('publish_job_logs')
export class PublishJobLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @ManyToOne(() => PublishJob, j => j.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: PublishJob;

  @Column({ name: 'page_id', type: 'uuid', nullable: true })
  pageId: string | null;

  @Column({ type: 'varchar', length: 10, default: 'info' })
  level: 'info' | 'warn' | 'error';

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', default: {} })
  context: Record<string, unknown>;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
