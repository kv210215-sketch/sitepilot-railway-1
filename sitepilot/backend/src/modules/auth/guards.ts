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

// ── Org Roles Guard ───────────────────────────────────────────────────────────
//
// Applied to every org-scoped (project-scoped) route.
// Always verifies active membership — even when no @Roles() is set.
// Attaches request.memberRole for downstream use.

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
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

    // Project owner always has full access
    if (project.ownerId === userId) {
      request.memberRole = UserRole.OWNER;
      return true;
    }

    const member = await this.memberRepo.findOne({
      where: { projectId, userId },
    });

    if (!member) throw new ForbiddenException('Немає доступу до цього проєкту');

    if (requiredRoles?.length && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Для цієї дії потрібна роль: ${requiredRoles.join(' або ')}`,
      );
    }

    request.memberRole = member.role;
    return true;
  }
}

// Backward-compatible alias
export { OrgRolesGuard as ProjectRoleGuard };
