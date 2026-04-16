import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, MinLength, MaxLength,
  Matches, IsInt, Min, Max, IsBoolean, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Create Organization ────────────────────────────────────────────────────────

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp', minLength: 2, maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    example: 'acme-corp',
    description: 'URL-friendly slug (a-z, 0-9, hyphens). Auto-generated from name if omitted.',
    pattern: '^[a-z0-9-]+$',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' })
  slug?: string;

  @ApiPropertyOptional({ example: 'We build amazing products' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

// ── Update Organization ────────────────────────────────────────────────────────

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Corp Updated' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'acme-corp-updated' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' })
  slug?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Arbitrary settings object' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

// ── List Organizations Query ───────────────────────────────────────────────────

export class ListOrganizationsQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by name or slug' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by isActive' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

// ── Organization Response ──────────────────────────────────────────────────────

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  settings: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ── Paginated Organizations ────────────────────────────────────────────────────

export class PaginatedOrganizationsDto {
  @ApiProperty({ type: [OrganizationResponseDto] })
  data: OrganizationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
