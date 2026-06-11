import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project, ProjectStatus } from './project.entity';
import { OrganizationMember, OrgRole } from '../organizations/entities/organization-member.entity';
import { SystemRole } from '../users/user.entity';

import {
  CreateProjectDto, UpdateProjectDto, ListProjectsQueryDto,
  ProjectResponseDto, PaginatedProjectsDto,
} from './projects.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────────
  // SUPER_ADMIN sees all. Others see only projects of orgs they are active members of.

  async list(
    userId: string,
    systemRole: SystemRole,
    query: ListProjectsQueryDto,
  ): Promise<PaginatedProjectsDto> {
    const page  = query.page  ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip  = (page - 1) * limit;

    const qb = this.projectRepo.createQueryBuilder('p')
      .where('p.deleted_at IS NULL');

    if (systemRole !== SystemRole.SUPER_ADMIN) {
      qb.innerJoin(
        OrganizationMember,
        'om',
        'om.organization_id = p.organization_id AND om.user_id = :userId AND om.is_active = true',
        { userId },
      ).andWhere('p.organization_id IS NOT NULL');
    }

    if (query.organizationId) {
      qb.andWhere('p.organization_id = :orgId', { orgId: query.organizationId });
    }
    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }
    if (query.projectType) {
      qb.andWhere('p.project_type = :pt', { pt: query.projectType });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('p.is_active = :isActive', { isActive: query.isActive });
    }
    if (query.search) {
      qb.andWhere('(p.name ILIKE :q OR p.slug ILIKE :q)', { q: `%${query.search}%` });
    }

    const orderCol = {
      name:      'p.name',
      createdAt: 'p.createdAt',
      updatedAt: 'p.updatedAt',
    }[query.orderBy ?? 'createdAt'] ?? 'p.createdAt';

    const [projects, total] = await qb
      .orderBy(orderCol, 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: projects.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get one ──────────────────────────────────────────────────────────────────

  async getOne(
    projectId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<ProjectResponseDto> {
    const { project } = await this.resolveAccess(projectId, userId, systemRole);
    return this.toResponseDto(project);
  }

  // ── Create ───────────────────────────────────────────────────────────────────
  // Requires ADMIN or OWNER of the target organization.

  async create(
    dto: CreateProjectDto,
    userId: string,
    systemRole: SystemRole,
  ): Promise<ProjectResponseDto> {
    // Verify requester is ADMIN/OWNER of the target org (SUPER_ADMIN bypasses)
    if (systemRole !== SystemRole.SUPER_ADMIN) {
      const member = await this.memberRepo.findOne({
        where: { organizationId: dto.organizationId, userId, isActive: true },
      });
      if (!member) {
        throw new ForbiddenException('Немає доступу до цієї організації');
      }
      if (member.role !== OrgRole.OWNER && member.role !== OrgRole.ADMIN) {
        throw new ForbiddenException('Потрібна роль: owner або admin');
      }
    }

    const slug = dto.slug ?? this.generateSlug(dto.name);

    // Slug must be unique within the organization
    const existing = await this.projectRepo.findOne({
      where: { organizationId: dto.organizationId, slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" вже використовується в цій організації`);
    }

    const project = this.projectRepo.create({
      organizationId:   dto.organizationId,
      createdByUserId:  userId,
      name:             dto.name,
      slug,
      domain:           dto.domain     ?? null,
      description:      dto.description ?? null,
      projectType:      dto.projectType ?? undefined,
      status:           ProjectStatus.DRAFT,
      isActive:         true,
    });

    await this.projectRepo.save(project);
    this.logger.log(`Project created: ${project.id} in org ${dto.organizationId} by ${userId}`);
    return this.toResponseDto(project);
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  // Requires ADMIN or OWNER (enforced by guard + service defense-in-depth).

  async update(
    projectId: string,
    dto: UpdateProjectDto,
    userId: string,
    systemRole: SystemRole,
  ): Promise<ProjectResponseDto> {
    const { project } = await this.resolveAccess(
      projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    if (dto.slug !== undefined && dto.slug !== project.slug) {
      const conflict = await this.projectRepo.findOne({
        where: { organizationId: project.organizationId!, slug: dto.slug },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${dto.slug}" вже використовується в цій організації`);
      }
    }

    if (dto.name        !== undefined) project.name        = dto.name;
    if (dto.slug        !== undefined) project.slug        = dto.slug;
    if (dto.domain      !== undefined) project.domain      = dto.domain ?? null;
    if (dto.description !== undefined) project.description = dto.description ?? null;
    if (dto.projectType !== undefined) project.projectType = dto.projectType;
    if (dto.status      !== undefined) project.status      = dto.status;
    if (dto.isActive    !== undefined) project.isActive    = dto.isActive;
    if (dto.seoDefaults !== undefined) project.seoDefaults = dto.seoDefaults;
    if (dto.settings    !== undefined) project.settings    = dto.settings;

    await this.projectRepo.save(project);
    return this.toResponseDto(project);
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  async archive(
    projectId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<ProjectResponseDto> {
    const { project } = await this.resolveAccess(
      projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    project.status     = ProjectStatus.ARCHIVED;
    project.archivedAt = new Date();
    await this.projectRepo.save(project);
    return this.toResponseDto(project);
  }

  // ── Soft delete ──────────────────────────────────────────────────────────────

  async remove(
    projectId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<{ message: string }> {
    await this.resolveAccess(projectId, userId, systemRole, [OrgRole.OWNER]);
    await this.projectRepo.softDelete(projectId);
    this.logger.warn(`Project soft-deleted: ${projectId} by ${userId}`);
    return { message: 'Проєкт видалено' };
  }

  // ── Internal helpers ─────────────────────────────────────────────────────────

  /**
   * Load a project and verify org membership.
   * Returns { project, member } where member is null for SUPER_ADMIN.
   * Throws NotFoundException or ForbiddenException on failure.
   */
  async resolveAccess(
    projectId: string,
    userId: string,
    systemRole: SystemRole,
    requiredRoles?: OrgRole[],
  ): Promise<{ project: Project; member: OrganizationMember | null }> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project || project.deletedAt) {
      throw new NotFoundException('Проєкт не знайдено');
    }

    if (systemRole === SystemRole.SUPER_ADMIN) {
      return { project, member: null };
    }

    const { organizationId } = project;
    if (!organizationId) {
      throw new ForbiddenException('Проєкт не прив\'язаний до організації');
    }

    const member = await this.memberRepo.findOne({
      where: { organizationId, userId, isActive: true },
    });

    if (!member) {
      throw new ForbiddenException('Немає доступу до цього проєкту');
    }

    if (requiredRoles?.length && member.role !== OrgRole.OWNER && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException(`Потрібна роль: ${requiredRoles.join(' або ')}`);
    }

    return { project, member };
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);
  }

  toResponseDto(p: Project): ProjectResponseDto {
    return {
      id:              p.id,
      organizationId:  p.organizationId,
      name:            p.name,
      slug:            p.slug,
      domain:          p.domain,
      projectType:     p.projectType,
      status:          p.status,
      isActive:        p.isActive,
      description:     p.description,
      createdByUserId: p.createdByUserId,
      settings:        p.settings,
      seoDefaults:     p.seoDefaults,
      createdAt:       p.createdAt,
      updatedAt:       p.updatedAt,
    };
  }
}
