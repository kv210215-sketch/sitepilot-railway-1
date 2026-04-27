import {
  IsString, IsEnum, IsOptional, IsUUID,
  IsBoolean, IsInt, MinLength, MaxLength,
  IsUrl, Matches, Min, Max,
  IsObject, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PageStatus, PageType } from './page.entity';

// ── SEO sub-DTO ───────────────────────────────────────────────────────────────

export class UpdatePageSeoDto {
  @ApiPropertyOptional({ example: 'Сонячні панелі Львів | Solomiya Energy' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  ogTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  canonicalUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  robotsIndex?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  robotsFollow?: boolean;

  // Legacy fields kept for backwards compatibility with Sprint 2
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @ApiPropertyOptional({ default: 'index, follow' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  robots?: string;
}

// ── Create ────────────────────────────────────────────────────────────────────

export class CreatePageDto {
  @ApiProperty({ description: 'Project this page belongs to' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: 'Головна сторінка', description: 'Internal page name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({ example: 'СЕС для бізнесу Львів', description: 'Display title / H1 candidate' })
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional({ example: 'ses-dlya-biznesu-lviv' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug: тільки малі літери, цифри і дефіси',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: '/ses-dlya-biznesu-lviv',
    description: 'URL path — must start with /',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^\//, { message: 'path має починатись з /' })
  path?: string;

  @ApiPropertyOptional({ enum: PageType, default: PageType.PAGE })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHomepage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

// ── Update ────────────────────────────────────────────────────────────────────

export class UpdatePageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug: тільки малі літери, цифри і дефіси',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'URL path — must start with /',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^\//, { message: 'path має починатись з /' })
  path?: string;

  @ApiPropertyOptional({ enum: PageType })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;

  @ApiPropertyOptional({ enum: PageStatus })
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHomepage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  h1?: string;

  @ApiPropertyOptional({ description: 'Raw HTML/text body of the page' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: () => UpdatePageSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePageSeoDto)
  seo?: UpdatePageSeoDto;
}

// ── List query ────────────────────────────────────────────────────────────────

export class ListPagesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: PageType })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;

  @ApiPropertyOptional({ enum: PageStatus })
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isHomepage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 30, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;

  @ApiPropertyOptional({
    enum: ['name', 'title', 'createdAt', 'updatedAt', 'sortOrder'],
    default: 'sortOrder',
  })
  @IsOptional()
  @IsString()
  orderBy?: 'name' | 'title' | 'createdAt' | 'updatedAt' | 'sortOrder' = 'sortOrder';
}

// ── Generate / legacy DTOs (Sprint 2, unchanged) ──────────────────────────────

export class GeneratePageDto {
  @ApiProperty({ example: 'uuid-of-template' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: 'СЕС для бізнесу Львів' })
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 'Львів' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  power?: number;

  @ApiPropertyOptional({ enum: ['home', 'business'] })
  @IsOptional()
  @IsEnum(['home', 'business'])
  audience?: 'home' | 'business';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

// ── Response ──────────────────────────────────────────────────────────────────

export class PageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty({ nullable: true }) name: string | null;
  @ApiProperty() title: string;
  @ApiProperty() slug: string;
  @ApiProperty({ nullable: true }) path: string | null;
  @ApiProperty({ enum: PageType }) pageType: PageType;
  @ApiProperty({ enum: PageStatus }) status: PageStatus;
  @ApiProperty() isHomepage: boolean;

  // Content
  @ApiProperty({ nullable: true }) h1: string | null;
  @ApiProperty({ nullable: true }) body: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true }) content: Record<string, unknown>;

  // SEO
  @ApiProperty({ nullable: true }) metaTitle: string | null;
  @ApiProperty({ nullable: true }) metaDescription: string | null;
  @ApiProperty({ nullable: true }) seoTitle: string | null;
  @ApiProperty({ nullable: true }) seoDescription: string | null;
  @ApiProperty({ nullable: true }) ogTitle: string | null;
  @ApiProperty({ nullable: true }) ogDescription: string | null;
  @ApiProperty({ nullable: true }) ogImageUrl: string | null;
  @ApiProperty({ nullable: true }) canonicalUrl: string | null;
  @ApiProperty() robotsIndex: boolean;
  @ApiProperty() robotsFollow: boolean;

  // Meta
  @ApiProperty() sortOrder: number;
  @ApiProperty({ nullable: true }) publishedAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedPagesDto {
  @ApiProperty({ type: [PageResponseDto] }) data: PageResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

// Kept for Sprint 2 backwards compatibility
export class ListPagesDto extends ListPagesQueryDto {}
export { UpdatePageSeoDto as UpdateSeoDto };
