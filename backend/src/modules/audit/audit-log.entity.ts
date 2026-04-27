// ═══════════════════════════════════════════
// audit-log.entity.ts
// ═══════════════════════════════════════════
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User }    from '../users/user.entity';
import { Project } from '../projects/project.entity';

export type AuditAction =
  | 'user_login' | 'user_logout' | 'user_registered'
  | 'project_created' | 'project_updated' | 'project_archived' | 'project_deleted'
  | 'page_created' | 'page_updated' | 'page_archived' | 'page_deleted'
  | 'page_generated'
  | 'publish_started' | 'publish_success' | 'publish_failed' | 'publish_cancelled'
  | 'template_created' | 'template_applied' | 'template_deleted'
  | 'backup_created' | 'backup_restored'
  | 'team_member_added' | 'team_member_removed' | 'role_changed'
  | 'content_changed' | 'seo_updated'
  | 'settings_changed';

@Entity('audit_logs')
@Index(['projectId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 80 })
  action: AuditAction;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'text', nullable: true })
  entityId: string | null;

  @Column({ name: 'entity_name', type: 'varchar', length: 300, nullable: true })
  entityName: string | null;

  @Column({ type: 'jsonb', default: {} })
  changes: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
