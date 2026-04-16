import {
  Injectable, CanActivate, ExecutionContext,
  SetMetadata, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember, OrgRole } from '../../organizations/entities/organization-member.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { SystemRole } from '../../users/user.entity';

export const ORG_ROLES_KEY = 'orgRoles';
export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // SUPER_ADMIN bypasses org-level checks
    if (user.role === SystemRole.SUPER_ADMIN) return true;

    const organizationId: string = request.params?.organizationId ?? request.params?.id;
    if (!organizationId) return false;

    const org = await this.orgRepo.findOne({ where: { id: organizationId } });
    if (!org || !org.isActive) throw new NotFoundException('Організацію не знайдено');

    const member = await this.memberRepo.findOne({
      where: { organizationId, userId: user.id, isActive: true },
    });

    if (!member) throw new ForbiddenException('Немає доступу до цієї організації');

    // Always attach member to request for downstream use
    request.orgMember = member;

    // If specific roles required, enforce them (OWNER always passes)
    if (required?.length && member.role !== OrgRole.OWNER && !required.includes(member.role)) {
      throw new ForbiddenException(`Потрібна роль: ${required.join(' або ')}`);
    }

    return true;
  }
}
