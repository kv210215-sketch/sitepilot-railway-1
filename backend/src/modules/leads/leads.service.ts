import {
  Injectable, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Project } from '../projects/project.entity';
import { OrganizationMember, OrgRole } from '../organizations/entities/organization-member.entity';
import { MailService } from '../mail/mail.service';
import { Lead, LeadStatus } from './lead.entity';
import { CreateLeadDto, ListLeadsQueryDto } from './leads.dto';

export interface LeadRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ── Public ingest ──────────────────────────────────────────────────────────────

  /**
   * Persists a public lead submission and notifies the project owner.
   * Returns null when the submission is dropped as spam (honeypot filled).
   */
  async createFromPublic(dto: CreateLeadDto, ctx: LeadRequestContext = {}): Promise<Lead | null> {
    // 1) Honeypot — bots fill the hidden `website` field. Drop silently.
    if (dto.website && dto.website.trim().length > 0) {
      this.logger.warn(`Dropped honeypot lead submission for project ${dto.projectId}`);
      return null;
    }

    // 2) Require at least one contact channel.
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Provide at least an email or a phone number');
    }

    // 3) Resolve target project (must be active / not deleted).
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId, deletedAt: IsNull(), isActive: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 4) Persist.
    const lead = this.leadRepo.create({
      projectId: project.id,
      pageId:    dto.pageId ?? null,
      name:      dto.name,
      email:     dto.email ?? null,
      phone:     dto.phone ?? null,
      message:   dto.message ?? null,
      pagePath:  dto.pagePath ?? null,
      source:    'public_form',
      consent:   dto.consent ?? false,
      status:    LeadStatus.NEW,
      ipAddress: ctx.ipAddress ?? null,
      metadata: {
        ...(dto.metadata ?? {}),
        ...(ctx.userAgent ? { userAgent: ctx.userAgent } : {}),
        ...(ctx.referrer ? { referrer: ctx.referrer } : {}),
      },
    });
    const saved = await this.leadRepo.save(lead);

    // 5) Notify owner — best-effort, never blocks the visitor response.
    this.notifyOwners(project, saved).catch((err) =>
      this.logger.error(`Lead notification failed for ${saved.id}: ${(err as Error).message}`),
    );

    return saved;
  }

  // ── Dashboard read ──────────────────────────────────────────────────────────────

  async list(projectId: string, query: ListLeadsQueryDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.leadRepo.createQueryBuilder('lead')
      .where('lead.project_id = :projectId', { projectId })
      .andWhere('lead.deleted_at IS NULL')
      .orderBy('lead.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('lead.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async getOne(projectId: string, leadId: string): Promise<Lead> {
    const lead = await this.leadRepo.findOne({
      where: { id: leadId, projectId, deletedAt: IsNull() },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  // ── Notification ──────────────────────────────────────────────────────────────────

  private async notifyOwners(project: Project, lead: Lead): Promise<void> {
    const recipients = new Set<string>();

    if (project.organizationId) {
      const owners = await this.memberRepo.find({
        where: {
          organizationId: project.organizationId,
          role: OrgRole.OWNER,
          isActive: true,
        },
        relations: ['user'],
      });
      for (const m of owners) {
        const email = (m.user as { email?: string } | undefined)?.email;
        if (email) recipients.add(email);
      }
    }

    const catchAll = this.config.get<string>('mail.leadsNotifyEmail');
    if (catchAll) recipients.add(catchAll);

    if (recipients.size === 0) {
      this.logger.warn(`No notification recipient for lead ${lead.id} (project ${project.id})`);
      return;
    }

    const subject = `🟢 Новий лід — ${project.name}: ${lead.name}`;
    const lines = [
      `Новий лід на проєкті "${project.name}".`,
      '',
      `Ім'я:    ${lead.name}`,
      `Email:   ${lead.email ?? '—'}`,
      `Телефон: ${lead.phone ?? '—'}`,
      `Сторінка: ${lead.pagePath ?? '—'}`,
      '',
      'Повідомлення:',
      lead.message ?? '—',
    ];

    await this.mail.sendMail({
      to: Array.from(recipients),
      subject,
      text: lines.join('\n'),
      replyTo: lead.email ?? undefined,
    });
  }
}
