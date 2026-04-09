import {
  IsString, IsEnum, IsOptional,
  MinLength, MaxLength, IsUrl, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProjectType, ProjectStatus } from './project.entity';
import { UserRole } from './project-member.entity';

// ── Create ────────────────────────────────────────────────────────────────────

export class CreateProjectDto {
  @ApiProperty({ example: 'Solomiya Energy' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ example: 'solomiya-energy' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug: тільки малі літери, цифри і дефіси',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'www.solomiya-energy.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional({ enum: ProjectType, default: ProjectType.SERVICE_SITE })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

// ── Update ────────────────────────────────────────────────────────────────────

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  seoDefaults?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, unknown>;
}

// ── List query ────────────────────────────────────────────────────────────────

export class ListProjectsDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

// ── Member ────────────────────────────────────────────────────────────────────

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

// ── Response ──────────────────────────────────────────────────────────────────

export class ProjectResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty({ nullable: true }) domain: string | null;
  @ApiProperty({ enum: ProjectType }) projectType: ProjectType;
  @ApiProperty({ enum: ProjectStatus }) status: ProjectStatus;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty() settings: Record<string, unknown>;
  @ApiProperty() seoDefaults: Record<string, unknown>;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() pagesCount?: number;
  @ApiPropertyOptional() membersCount?: number;
}

export class PaginatedProjectsDto {
  @ApiProperty({ type: [ProjectResponseDto] }) data: ProjectResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
