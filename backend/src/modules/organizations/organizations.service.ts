import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from './entities/organization.entity';
import { OrganizationMember, OrgRole } from './entities/organization-member.entity';
import { SystemRole } from '../users/user.entity';

import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  ListOrganizationsQueryDto,
  OrganizationResponseDto,
  PaginatedOrganizationsDto,
} from './dto/organization.dto';
import {
  AddOrganizationMemberDto,
  UpdateOrganizationMemberRoleDto,
  ListOrganizationMembersQueryDto,
  OrganizationMemberResponseDto,
  PaginatedOrganizationMembersDto,
} from './dto/organization-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
  ) {}

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(dto: CreateOrganizationDto, userId: string): Promise<OrganizationResponseDto> {
    const slug = dto.slug
      ? dto.slug
      : await this.generateSlug(dto.name);

    // Ensure slug uniqueness (if provided manually)
    if (dto.slug) {
      const existing = await this.orgRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`Організація з slug "${dto.slug}" вже існує`);
      }
    }

    const org = this.orgRepo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      ownerId: userId,
      isActive: true,
      settings: {},
    });

    await this.orgRepo.save(org);

    // Create OWNER membership atomically
    const member = this.memberRepo.create({
      organizationId: org.id,
      userId,
      role: OrgRole.OWNER,
      isActive: true,
      invitedByUserId: null,
    });
    await this.memberRepo.save(member);

    return this.toResponseDto(org);
  }

  // ── Find All For User ─────────────────────────────────────────────────────────

  async findAllForUser(
    userId: string,
    systemRole: SystemRole,
    query: ListOrganizationsQueryDto,
  ): Promise<PaginatedOrganizationsDto> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const qb = this.orgRepo.createQueryBuilder('o');

    // SUPER_ADMIN sees all, others only see their orgs
    if (systemRole !== SystemRole.SUPER_ADMIN) {
      qb.innerJoin(
        OrganizationMember,
        'm',
        'm.organization_id = o.id AND m.user_id = :userId AND m.is_active = true',
        { userId },
      );
    }

    if (query.search) {
      qb.andWhere('(o.name ILIKE :q OR o.slug ILIKE :q)', { q: `%${query.search}%` });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('o.is_active = :isActive', { isActive: query.isActive });
    }

    const [orgs, total] = await qb
      .orderBy('o.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: orgs.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Find By Id ────────────────────────────────────────────────────────────────

  async findById(
    id: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<OrganizationResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org || !org.isActive) {
      throw new NotFoundException('Організацію не знайдено');
    }

    if (systemRole !== SystemRole.SUPER_ADMIN) {
      const member = await this.memberRepo.findOne({
        where: { organizationId: id, userId, isActive: true },
      });
      if (!member) {
        throw new ForbiddenException('Немає доступу до цієї організації');
      }
    }

    return this.toResponseDto(org);
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    userId: string,
  ): Promise<OrganizationResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org || !org.isActive) {
      throw new NotFoundException('Організацію не знайдено');
    }

    // Check requester is OWNER or org ADMIN
    const member = await this.memberRepo.findOne({
      where: { organizationId: id, userId, isActive: true },
    });
    if (!member || (member.role !== OrgRole.OWNER && member.role !== OrgRole.ADMIN)) {
      throw new ForbiddenException('Потрібна роль: owner або admin');
    }

    if (dto.name !== undefined)        org.name        = dto.name;
    if (dto.description !== undefined) org.description = dto.description ?? null;
    if (dto.settings !== undefined)    org.settings    = dto.settings;

    if (dto.slug !== undefined) {
      if (dto.slug !== org.slug) {
        const conflict = await this.orgRepo.findOne({ where: { slug: dto.slug } });
        if (conflict) {
          throw new ConflictException(`Slug "${dto.slug}" вже зайнятий`);
        }
      }
      org.slug = dto.slug;
    }

    await this.orgRepo.save(org);
    return this.toResponseDto(org);
  }

  // ── Deactivate ────────────────────────────────────────────────────────────────

  async deactivate(
    id: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<{ message: string }> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org || !org.isActive) {
      throw new NotFoundException('Організацію не знайдено');
    }

    if (systemRole !== SystemRole.SUPER_ADMIN) {
      const member = await this.memberRepo.findOne({
        where: { organizationId: id, userId, isActive: true },
      });
      if (!member || member.role !== OrgRole.OWNER) {
        throw new ForbiddenException('Тільки власник може деактивувати організацію');
      }
    }

    await this.orgRepo.update(id, { isActive: false });
    return { message: 'Організацію деактивовано' };
  }

  // ── Get Members ───────────────────────────────────────────────────────────────

  async getMembers(
    orgId: string,
    query: ListOrganizationMembersQueryDto,
  ): Promise<PaginatedOrganizationMembersDto> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const qb = this.memberRepo.createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId });

    if (query.role) {
      qb.andWhere('m.role = :role', { role: query.role });
    }

    const [members, total] = await qb
      .orderBy('m.created_at', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: members.map(this.toMemberResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Add Member ────────────────────────────────────────────────────────────────

  async addMember(
    orgId: string,
    dto: AddOrganizationMemberDto,
    requesterId: string,
  ): Promise<OrganizationMemberResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org || !org.isActive) {
      throw new NotFoundException('Організацію не знайдено');
    }

    // Check requester is OWNER or ADMIN
    const requester = await this.memberRepo.findOne({
      where: { organizationId: orgId, userId: requesterId, isActive: true },
    });
    if (!requester || (requester.role !== OrgRole.OWNER && requester.role !== OrgRole.ADMIN)) {
      throw new ForbiddenException('Потрібна роль: owner або admin');
    }

    // Check for existing membership
    const existing = await this.memberRepo.findOne({
      where: { organizationId: orgId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Користувач вже є учасником організації');
    }

    const member = this.memberRepo.create({
      organizationId: orgId,
      userId: dto.userId,
      role: dto.role ?? OrgRole.MEMBER,
      isActive: true,
      invitedByUserId: requesterId,
    });

    await this.memberRepo.save(member);
    return this.toMemberResponseDto(member);
  }

  // ── Update Member Role ────────────────────────────────────────────────────────

  async updateMemberRole(
    orgId: string,
    memberId: string,
    dto: UpdateOrganizationMemberRoleDto,
    requesterId: string,
  ): Promise<OrganizationMemberResponseDto> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org || !org.isActive) {
      throw new NotFoundException('Організацію не знайдено');
    }

    const requester = await this.memberRepo.findOne({
      where: { organizationId: orgId, userId: requesterId, isActive: true },
    });
    if (!requester || (requester.role !== OrgRole.OWNER && requester.role !== OrgRole.ADMIN)) {
      throw new ForbiddenException('Потрібна роль: owner або admin');
    }

    const target = await this.memberRepo.findOne({
      where: { id: memberId, organizationId: orgId },
    });
    if (!target) {
      throw new NotFoundException('Учасника не знайдено');
    }

    // org ADMIN cannot promote to OWNER
    if (requester.role === OrgRole.ADMIN && dto.role === OrgRole.OWNER) {
      throw new ForbiddenException('Адмін не може призначати роль owner');
    }

    // Protect last OWNER: cannot demote if they are the last owner
    if (target.role === OrgRole.OWNER && dto.role !== OrgRole.OWNER) {
      const ownerCount = await this.memberRepo.count({
        where: { organizationId: orgId, role: OrgRole.OWNER, isActive: true },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last organization owner');
      }
    }

    target.role = dto.role;
    await this.memberRepo.save(target);
    return this.toMemberResponseDto(target);
  }

  // ── Remove Member ─────────────────────────────────────────────────────────────

  async removeMember(
    orgId: string,
    memberId: string,
    requesterId: string,
  ): Promise<{ message: string }> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org || !org.isActive) {
      throw new NotFoundException('Організацію не знайдено');
    }

    const requester = await this.memberRepo.findOne({
      where: { organizationId: orgId, userId: requesterId, isActive: true },
    });
    if (!requester || (requester.role !== OrgRole.OWNER && requester.role !== OrgRole.ADMIN)) {
      throw new ForbiddenException('Потрібна роль: owner або admin');
    }

    const target = await this.memberRepo.findOne({
      where: { id: memberId, organizationId: orgId },
    });
    if (!target) {
      throw new NotFoundException('Учасника не знайдено');
    }

    // Cannot remove last OWNER
    if (target.role === OrgRole.OWNER) {
      const ownerCount = await this.memberRepo.count({
        where: { organizationId: orgId, role: OrgRole.OWNER, isActive: true },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last organization owner');
      }
    }

    // ADMIN can only remove MEMBER, not OWNER or other ADMIN
    if (requester.role === OrgRole.ADMIN && target.role !== OrgRole.MEMBER) {
      throw new ForbiddenException('Адмін може видаляти тільки учасників з роллю member');
    }

    await this.memberRepo.remove(target);
    return { message: 'Учасника видалено з організації' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  async generateSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 180);

    let slug = base;
    let attempt = 0;

    while (true) {
      const existing = await this.orgRepo.findOne({ where: { slug } });
      if (!existing) return slug;
      attempt += 1;
      slug = `${base}-${attempt}`;
    }
  }

  private toResponseDto(org: Organization): OrganizationResponseDto {
    return {
      id:          org.id,
      name:        org.name,
      slug:        org.slug,
      description: org.description,
      isActive:    org.isActive,
      ownerId:     org.ownerId,
      settings:    org.settings,
      createdAt:   org.createdAt,
      updatedAt:   org.updatedAt,
    };
  }

  private toMemberResponseDto(member: OrganizationMember): OrganizationMemberResponseDto {
    return {
      id:               member.id,
      organizationId:   member.organizationId,
      userId:           member.userId,
      role:             member.role,
      isActive:         member.isActive,
      invitedByUserId:  member.invitedByUserId,
      createdAt:        member.createdAt,
    };
  }
}
