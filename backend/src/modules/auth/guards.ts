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

// ── Removed: ProjectRoleGuard / ProjectRoles ──────────────────────────────────
// The old owner-based + project-member-based access control was replaced in
// Stage 5 by org-level membership access via ProjectAccessGuard /
// PageAccessGuard in src/modules/common/guards/project-access.guard.ts.
// Access to projects and pages is now determined exclusively by the requester's
// role in the project's parent organization (OrgRole: owner / admin / member).
