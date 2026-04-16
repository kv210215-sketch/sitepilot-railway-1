import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiResponse, ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { OrgRolesGuard, OrgRoles } from '../common/guards/org-roles.guard';
import { OrgRole } from './entities/organization-member.entity';
import { OrganizationsService } from './organizations.service';

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

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ── GET /organizations ────────────────────────────────────────────────────────
  // No org-scoped guard — service filters by userId membership internally

  @Get()
  @ApiOperation({ summary: 'Список організацій для поточного користувача' })
  @ApiResponse({ status: 200, type: PaginatedOrganizationsDto })
  findAll(
    @Query() query: ListOrganizationsQueryDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<PaginatedOrganizationsDto> {
    return this.organizationsService.findAllForUser(
      currentUser.id,
      currentUser.role,
      query,
    );
  }

  // ── POST /organizations ───────────────────────────────────────────────────────
  // Any authenticated user may create an org (becomes OWNER automatically)

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Створити організацію' })
  @ApiResponse({ status: 201, type: OrganizationResponseDto })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.create(dto, currentUser.id);
  }

  // ── GET /organizations/:id ────────────────────────────────────────────────────
  // Requires active membership (any role). SUPER_ADMIN bypasses.

  @Get(':id')
  @UseGuards(OrgRolesGuard)
  @OrgRoles()
  @ApiOperation({ summary: 'Отримати організацію по ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this organization' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findById(id, currentUser.id, currentUser.role);
  }

  // ── PATCH /organizations/:id ──────────────────────────────────────────────────
  // Requires org OWNER or ADMIN. SUPER_ADMIN bypasses.

  @Patch(':id')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @ApiOperation({ summary: 'Оновити організацію (owner або admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 403, description: 'Requires owner or admin role' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(id, dto, currentUser.id);
  }

  // ── DELETE /organizations/:id ─────────────────────────────────────────────────
  // Requires org OWNER only. SUPER_ADMIN bypasses.

  @Delete(':id')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Деактивувати організацію (тільки owner або SUPER_ADMIN)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Requires owner role' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<{ message: string }> {
    return this.organizationsService.deactivate(id, currentUser.id, currentUser.role);
  }

  // ── GET /organizations/:organizationId/members ────────────────────────────────
  // Requires active membership (any role). SUPER_ADMIN bypasses.
  // Previously: no access control — any authenticated user could enumerate members.

  @Get(':organizationId/members')
  @UseGuards(OrgRolesGuard)
  @OrgRoles()
  @ApiOperation({ summary: 'Список учасників організації (тільки члени організації)' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiResponse({ status: 200, type: PaginatedOrganizationMembersDto })
  @ApiResponse({ status: 403, description: 'Not a member of this organization' })
  getMembers(
    @Param('organizationId') organizationId: string,
    @Query() query: ListOrganizationMembersQueryDto,
  ): Promise<PaginatedOrganizationMembersDto> {
    return this.organizationsService.getMembers(organizationId, query);
  }

  // ── POST /organizations/:organizationId/members ───────────────────────────────
  // Requires org OWNER or ADMIN. SUPER_ADMIN bypasses.

  @Post(':organizationId/members')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Додати учасника до організації (owner або admin)' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiResponse({ status: 201, type: OrganizationMemberResponseDto })
  @ApiResponse({ status: 403, description: 'Requires owner or admin role' })
  addMember(
    @Param('organizationId') organizationId: string,
    @Body() dto: AddOrganizationMemberDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<OrganizationMemberResponseDto> {
    return this.organizationsService.addMember(organizationId, dto, currentUser.id);
  }

  // ── PATCH /organizations/:organizationId/members/:memberId ────────────────────
  // Requires org OWNER or ADMIN. SUPER_ADMIN bypasses.

  @Patch(':organizationId/members/:memberId')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @ApiOperation({ summary: 'Змінити роль учасника (owner або admin)' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiParam({ name: 'memberId', type: String })
  @ApiResponse({ status: 200, type: OrganizationMemberResponseDto })
  @ApiResponse({ status: 403, description: 'Requires owner or admin role' })
  updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateOrganizationMemberRoleDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<OrganizationMemberResponseDto> {
    return this.organizationsService.updateMemberRole(
      organizationId,
      memberId,
      dto,
      currentUser.id,
    );
  }

  // ── DELETE /organizations/:organizationId/members/:memberId ───────────────────
  // Requires org OWNER or ADMIN. SUPER_ADMIN bypasses.

  @Delete(':organizationId/members/:memberId')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити учасника з організації' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiParam({ name: 'memberId', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Requires owner or admin role' })
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<{ message: string }> {
    return this.organizationsService.removeMember(organizationId, memberId, currentUser.id);
  }
}
