import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions } from 'typeorm';

import { Project, ProjectStatus } from './project.entity';
import { ProjectMember, UserRole } from './project-member.entity';
import {
  CreateProjectDto, UpdateProjectDto, ListProjectsDto,
  AddMemberDto, UpdateMemberRoleDto,
  ProjectResponseDto, PaginatedProjectsDto,
} from './projects.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────────

  async listForUser(userId: string, query: ListProjectsDto): Promise<PaginatedProjectsDto> {
    const { status, projectType, page = 1, limit = 20, search } = query;
    const skip = (page - 1) * Math.min(limit, 100);

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoin('project_members', 'pm', 'pm.project_id = p.id AND pm.user_id = :userId', { userId })
      .where('(p.owner_id = :userId OR pm.user_id = :userId)', { userId })
      .andWhere('p.deleted_at IS NULL');

    if (status) qb.andWhere('p.status = :status', { status });
    if (projectType) qb.andWhere('p.project_type = :projectType', { projectType });
    if (search) qb.andWhere('p.name ILIKE :search', { search: `%${search}%` });

    const [projects, total] = await qb
      .orderBy('p.updated_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: projects.map(this.toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get one ──────────────────────────────────────────────────────────────────

  async getOne(projectId: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.findAccessible(projectId, userId);
    return this.toResponse(project);
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(dto: CreateProjectDto, ownerId: string): Promise<ProjectResponseDto> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    const exists = await this.projectRepo.findOne({
      where: { ownerId, slug },
    });
    if (exists) throw new ConflictException(`Slug "${slug}" вже використовується`);

    const project = this.projectRepo.create({
      ...dto,
      slug,
      ownerId,
      status: ProjectStatus.DRAFT,
    });

    await this.projectRepo.save(project);
    this.logger.log(`Project created: ${project.id} by ${ownerId}`);
    return this.toResponse(project);
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(
    projectId: string,
    dto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.findAccessible(projectId, userId);
    await this.assertRole(projectId, userId, project.ownerId, [
      UserRole.OWNER, UserRole.MANAGER,
    ]);

    if (dto.slug && dto.slug !== project.slug) {
      const slugConflict = await this.projectRepo.findOne({
        where: { ownerId: project.ownerId, slug: dto.slug },
      });
      if (slugConflict) throw new ConflictException(`Slug "${dto.slug}" вже використовується`);
    }

    Object.assign(project, dto);
    await this.projectRepo.save(project);
    return this.toResponse(project);
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  async archive(projectId: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.findAccessible(projectId, userId);
    await this.assertRole(projectId, userId, project.ownerId, [UserRole.OWNER]);

    project.status = ProjectStatus.ARCHIVED;
    project.archivedAt = new Date();
    await this.projectRepo.save(project);
    return this.toResponse(project);
  }

  // ── Delete (soft) ────────────────────────────────────────────────────────────

  async remove(projectId: string, userId: string): Promise<{ message: string }> {
    const project = await this.findAccessible(projectId, userId);
    await this.assertRole(projectId, userId, project.ownerId, [UserRole.OWNER]);

    await this.projectRepo.softDelete(projectId);
    this.logger.warn(`Project soft-deleted: ${projectId} by ${userId}`);
    return { message: 'Проєкт видалено' };
  }

  // ── Members ──────────────────────────────────────────────────────────────────

  async getMembers(projectId: string, userId: string) {
    await this.findAccessible(projectId, userId);
    return this.memberRepo.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMember(projectId: string, dto: AddMemberDto, requesterId: string) {
    const project = await this.findAccessible(projectId, requesterId);
    await this.assertRole(projectId, requesterId, project.ownerId, [
      UserRole.OWNER, UserRole.MANAGER,
    ]);

    if (dto.userId === project.ownerId) {
      throw new BadRequestException('Власник вже має повний доступ');
    }

    const existing = await this.memberRepo.findOne({
      where: { projectId, userId: dto.userId },
    });
    if (existing) throw new ConflictException('Користувач вже є учасником');

    const member = this.memberRepo.create({
      projectId,
      userId: dto.userId,
      role: dto.role,
      addedBy: requesterId,
    });

    return this.memberRepo.save(member);
  }

  async updateMemberRole(
    projectId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requesterId: string,
  ) {
    const project = await this.findAccessible(projectId, requesterId);
    await this.assertRole(projectId, requesterId, project.ownerId, [UserRole.OWNER]);

    const member = await this.memberRepo.findOne({ where: { id: memberId, projectId } });
    if (!member) throw new NotFoundException('Учасника не знайдено');

    member.role = dto.role;
    return this.memberRepo.save(member);
  }

  async removeMember(projectId: string, memberId: string, requesterId: string) {
    const project = await this.findAccessible(projectId, requesterId);
    await this.assertRole(projectId, requesterId, project.ownerId, [
      UserRole.OWNER, UserRole.MANAGER,
    ]);

    const member = await this.memberRepo.findOne({ where: { id: memberId, projectId } });
    if (!member) throw new NotFoundException('Учасника не знайдено');

    await this.memberRepo.remove(member);
    return { message: 'Учасника видалено' };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async findAccessible(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Проєкт не знайдено');
    if (project.status === ProjectStatus.DELETED) {
      throw new NotFoundException('Проєкт не знайдено');
    }

    if (project.ownerId === userId) return project;

    const member = await this.memberRepo.findOne({
      where: { projectId, userId },
    });
    if (!member) throw new ForbiddenException('Немає доступу до цього проєкту');

    return project;
  }

  private async assertRole(
    projectId: string,
    userId: string,
    ownerId: string,
    allowedRoles: UserRole[],
  ): Promise<void> {
    if (userId === ownerId) return; // owner bypasses all

    const member = await this.memberRepo.findOne({ where: { projectId, userId } });
    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Потрібна роль: ${allowedRoles.join(' або ')}`,
      );
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);
  }

  private toResponse(p: Project): ProjectResponseDto {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      domain: p.domain,
      projectType: p.projectType,
      status: p.status,
      description: p.description,
      settings: p.settings,
      seoDefaults: p.seoDefaults,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
