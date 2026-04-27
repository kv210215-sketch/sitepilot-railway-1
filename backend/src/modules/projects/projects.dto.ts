import {
  IsString, IsEnum, IsOptional, IsUUID, IsBoolean,
  MinLength, MaxLength, Matches, IsInt, Min, Max,
} from 'class-validator';
import {
  ApiProperty, ApiPropertyOptional, PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ProjectType, ProjectStatus } from './project.entity';

// ── Create ────────────────────────────────────────────────────────────────────

export class CreateProjectDto {
  @ApiProperty({ example: 'Solomiya Energy' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'uuid-of-organization', description: 'Org ID this project belongs to' })
  @IsUUID()
  organizationId: string;

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

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug: тільки малі літери, цифри і дефіси',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  seoDefaults?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  settings?: Record<string, unknown>;
}

// ── List query ────────────────────────────────────────────────────────────────

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by organization' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    enum: ['name', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  orderBy?: 'name' | 'createdAt' | 'updatedAt' = 'createdAt';
}

// ── Response ──────────────────────────────────────────────────────────────────

export class ProjectResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string | null;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty({ nullable: true }) domain: string | null;
  @ApiProperty({ enum: ProjectType }) projectType: ProjectType;
  @ApiProperty({ enum: ProjectStatus }) status: ProjectStatus;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ nullable: true }) createdByUserId: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true }) settings: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true }) seoDefaults: Record<string, unknown>;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedProjectsDto {
  @ApiProperty({ type: [ProjectResponseDto] }) data: ProjectResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
