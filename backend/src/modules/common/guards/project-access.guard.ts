import {
  Injectable, CanActivate, ExecutionContext,
  SetMetadata, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrganizationMember, OrgRole } from '../../organizations/entities/organization-member.entity';
import { Project } from '../../projects/project.entity';
import { Page } from '../../pages/page.entity';
import { SystemRole } from '../../users/user.entity';

// ── Shared decorator ──────────────────────────────────────────────────────────
// Uses OrgRole for role names — access to projects/pages is determined by
// the requester's membership role in the project's parent organization.

export const PROJECT_ROLES_KEY = 'projectOrgRoles';
export const ProjectRoles = (...roles: OrgRole[]) => SetMetadata(PROJECT_ROLES_KEY, roles);

// ── ProjectAccessGuard ────────────────────────────────────────────────────────
// Use on routes that have :id or :projectId as a Project UUID in params.
// Resolves project → organizationId → org membership → role check.
// Attaches request.project and request.orgMember for downstream use.

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(PROJECT_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    if (user.role === SystemRole.SUPER_ADMIN) return true;

    const projectId: string = req.params?.id ?? req.params?.projectId;
    if (!projectId) return false;

    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Проєкт не знайдено');

    const { organizationId } = project;
    if (!organizationId) {
      throw new ForbiddenException('Проєкт не прив\'язаний до організації');
    }

    const member = await this.memberRepo.findOne({
      where: { organizationId, userId: user.id, isActive: true },
    });

    if (!member) throw new ForbiddenException('Немає доступу до цього проєкту');

    // Always attach resolved objects to request for downstream use
    req.project = project;
    req.orgMember = member;

    // Enforce required roles (OWNER always passes)
    if (required?.length && member.role !== OrgRole.OWNER && !required.includes(member.role)) {
      throw new ForbiddenException(`Потрібна роль: ${required.join(' або ')}`);
    }

    return true;
  }
}

// ── PageAccessGuard ───────────────────────────────────────────────────────────
// Use on standalone page routes that have :id as a Page UUID.
// Resolves page → project → organizationId → org membership → role check.
// Attaches request.page, request.project, request.orgMember.

@Injectable()
export class PageAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(PROJECT_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    if (user.role === SystemRole.SUPER_ADMIN) return true;

    const pageId: string = req.params?.id ?? req.params?.pageId;
    if (!pageId) return false;

    const page = await this.pageRepo.findOne({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Сторінку не знайдено');

    const project = await this.projectRepo.findOne({ where: { id: page.projectId } });
    if (!project) throw new NotFoundException('Проєкт не знайдено');

    const { organizationId } = project;
    if (!organizationId) {
      throw new ForbiddenException('Проєкт не прив\'язаний до організації');
    }

    const member = await this.memberRepo.findOne({
      where: { organizationId, userId: user.id, isActive: true },
    });

    if (!member) throw new ForbiddenException('Немає доступу до цієї сторінки');

    req.page = page;
    req.project = project;
    req.orgMember = member;

    if (required?.length && member.role !== OrgRole.OWNER && !required.includes(member.role)) {
      throw new ForbiddenException(`Потрібна роль: ${required.join(' або ')}`);
    }

    return true;
  }
}
