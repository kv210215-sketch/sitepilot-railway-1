import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '../../users/user.entity';

export const ROLES_KEY = 'systemRoles';
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user) return false;

    // SUPER_ADMIN bypasses all role checks
    if (user.role === SystemRole.SUPER_ADMIN) return true;

    return required.includes(user.role);
  }
}
