import {
  Injectable, ExecutionContext, SetMetadata,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

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

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember, UserRole } from '../projects/project-member.entity';
import { Project, ProjectStatus } from '../projects/project.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

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
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No role restriction set — allow any authenticated member
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = ctx.switchToHttp().getRequest();
    const userId: string = request.user?.id;
    const projectId: string = request.params?.projectId;

    if (!userId || !projectId) return false;

    // Ensure project exists and is not deleted
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      withDeleted: false,
    });

    if (!project) throw new NotFoundException('Проєкт не знайдено');
    if (project.status === ProjectStatus.DELETED) {
      throw new NotFoundException('Проєкт не знайдено');
    }

    // Owner always has full access
    if (project.ownerId === userId) return true;

    // Check membership and role
    const member = await this.memberRepo.findOne({
      where: { projectId, userId },
    });

    if (!member) throw new ForbiddenException('Немає доступу до цього проєкту');

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Для цієї дії потрібна роль: ${requiredRoles.join(' або ')}`,
      );
    }

    // Attach member role to request for downstream use
    request.memberRole = member.role;
    return true;
  }
}
