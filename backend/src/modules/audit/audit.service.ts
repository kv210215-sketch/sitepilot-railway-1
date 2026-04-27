// ═══════════════════════════════════════════
// audit.service.ts
// ═══════════════════════════════════════════
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export interface LogInput {
  userId?:     string | null;
  projectId?:  string;
  action:      AuditAction;
  entityType?: string;
  entityId?:   string;
  entityName?: string;
  changes?:    Record<string, unknown>;
  metadata?:   Record<string, unknown>;
  ipAddress?:  string;
}

export class AuditQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() action?:     string;
  @ApiPropertyOptional() @IsOptional() @IsString() entityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?:     string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => parseInt(value, 10)) page?:  number = 1;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => parseInt(value, 10)) limit?: number = 50;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  // ── Записати подію ────────────────────────────────────────────────────────

  async log(input: LogInput): Promise<void> {
    const entry = this.repo.create({
      userId:     input.userId ?? null,
      projectId:  input.projectId ?? null,
      action:     input.action,
      entityType: input.entityType ?? null,
      entityId:   input.entityId   ?? null,
      entityName: input.entityName ?? null,
      changes:    input.changes    ?? {},
      metadata:   input.metadata   ?? {},
      ipAddress:  input.ipAddress  ?? null,
    });
    await this.repo.save(entry);
  }

  // ── Список (для dashboard activity feed) ─────────────────────────────────

  async list(projectId: string, query: AuditQueryDto) {
    const { action, entityType, userId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * Math.min(limit, 200);

    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'u')
      .where('a.project_id = :projectId', { projectId })
      .orderBy('a.created_at', 'DESC');

    if (action)     qb.andWhere('a.action = :action', { action });
    if (entityType) qb.andWhere('a.entity_type = :entityType', { entityType });
    if (userId)     qb.andWhere('a.user_id = :userId', { userId });

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map(e => ({
        id:         e.id,
        action:     e.action,
        entityType: e.entityType,
        entityId:   e.entityId,
        entityName: e.entityName,
        changes:    e.changes,
        createdAt:  e.createdAt,
        userName:   (e.user as any)?.name ?? 'System',
        userEmail:  (e.user as any)?.email,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Глобальна стрічка (для головного dashboard) ───────────────────────────

  async globalFeed(userId: string, limit = 20) {
    return this.repo.find({
      where: { userId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
