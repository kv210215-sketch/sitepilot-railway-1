import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsOptional, IsUUID, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrgRole } from '../entities/organization-member.entity';

// ── Add Organization Member ────────────────────────────────────────────────────

export class AddOrganizationMemberDto {
  @ApiProperty({ description: 'UUID of the user to add', format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: OrgRole, default: OrgRole.MEMBER })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}

// ── Update Organization Member Role ───────────────────────────────────────────

export class UpdateOrganizationMemberRoleDto {
  @ApiProperty({ enum: OrgRole })
  @IsEnum(OrgRole)
  role: OrgRole;
}

// ── List Organization Members Query ───────────────────────────────────────────

export class ListOrganizationMembersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: OrgRole })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}

// ── Organization Member Response ──────────────────────────────────────────────

export class OrganizationMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  invitedByUserId: string | null;

  @ApiProperty()
  createdAt: Date;
}

// ── Paginated Organization Members ────────────────────────────────────────────

export class PaginatedOrganizationMembersDto {
  @ApiProperty({ type: [OrganizationMemberResponseDto] })
  data: OrganizationMemberResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
