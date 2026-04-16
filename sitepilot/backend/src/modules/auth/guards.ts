import {
  Injectable, ExecutionContext, SetMetadata,
  CanActivate, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectMember, UserRole } from '../projects/project-member.entity';
import { Project, ProjectStatus } from '../projects/project.entity';

// ── JWT Auth Guard ────────────────────────────────────────────────────────────

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(ctx);
  }
}

// ── Project Role Guard ────────────────────────────────────────────────────────
//
// Attach with @UseGuards(ProjectRoleGuard) on every :projectId route.
//
// Empty @ProjectRoles() = any active project member (no bypass).
// @ProjectRoles(UserRole.OWNER, ...) = requires one of the listed roles.
// project.ownerId === userId always passes (owner has full access).
// SUPER_ADMIN bypass: deferred — User entity has no admin flag yet.
// Attaches request.projectMember after every successful membership check.

export const PROJECT_ROLES_KEY = 'projectRoles';
export const ProjectRoles = (...roles: UserRole[]) => SetMetadata(PROJECT_ROLES_KEY, roles);

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(PROJECT_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const request = ctx.switchToHttp().getRequest();
    const userId: string = request.user?.id;
    const projectId: string = request.params?.projectId;

    if (!userId || !projectId) return false;

    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      withDeleted: false,
    });

    if (!project) throw new NotFoundException('Проєкт не знайдено');
    if (project.status === ProjectStatus.DELETED) {
      throw new NotFoundException('Проєкт не знайдено');
    }

    if (project.ownerId === userId) {
      request.projectMember = { projectId, userId, role: UserRole.OWNER } as ProjectMember;
      return true;
    }

    const member = await this.memberRepo.findOne({ where: { projectId, userId } });

    if (!member) throw new ForbiddenException('Немає доступу до цього проєкту');

    if (requiredRoles?.length && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException(`Для цієї дії потрібна роль: ${requiredRoles.join(' або ')}`);
    }

    request.projectMember = member;
    return true;
  }
}

// Backward-compatible aliases
export { ProjectRoleGuard as OrgRolesGuard };
export { ProjectRoles as Roles };
export { PROJECT_ROLES_KEY as ROLES_KEY };
