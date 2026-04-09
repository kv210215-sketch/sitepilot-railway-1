import {
  IsString, IsEnum, IsOptional, IsUUID,
  MinLength, MaxLength, IsInt, Min, IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PageStatus } from './page.entity';

// ── Create ────────────────────────────────────────────────────────────────────

export class CreatePageDto {
  @ApiProperty({ example: 'СЕС для бізнесу Львів' })
  @IsString() @MinLength(2) @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional({ example: 'ses-dlya-biznesu-lviv' })
  @IsOptional() @IsString() @MaxLength(300)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  urlPath?: string;
}

// ── SEO ───────────────────────────────────────────────────────────────────────

export class UpdateSeoDto {
  @ApiPropertyOptional({ example: 'СЕС для бізнесу Львів | Solomiya Energy' })
  @IsOptional() @IsString() @MaxLength(300)
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  seoKeywords?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(300)
  ogTitle?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  ogDescription?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  ogImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  canonicalUrl?: string;

  @ApiPropertyOptional({ default: 'index, follow' })
  @IsOptional() @IsString() @MaxLength(100)
  robots?: string;
}

// ── Update ────────────────────────────────────────────────────────────────────

export class UpdatePageDto extends PartialType(CreatePageDto) {
  @ApiPropertyOptional({ enum: PageStatus })
  @IsOptional() @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  seo?: UpdateSeoDto;
}

// ── List query ────────────────────────────────────────────────────────────────

export class ListPagesDto {
  @ApiPropertyOptional({ enum: PageStatus })
  @IsOptional() @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 30;

  @ApiPropertyOptional({ enum: ['title', 'created_at', 'updated_at', 'sort_order'] })
  @IsOptional() @IsString()
  orderBy?: string = 'sort_order';
}

// ── Generate ──────────────────────────────────────────────────────────────────

export class GeneratePageDto {
  @ApiProperty({ example: 'uuid-of-template' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: 'СЕС для бізнесу Львів' })
  @IsString() @MinLength(2) @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 'Львів' })
  @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 10, description: 'Потужність кВт' })
  @IsOptional() @IsInt() @Min(1)
  @Type(() => Number)
  power?: number;

  @ApiPropertyOptional({ enum: ['home', 'business'] })
  @IsOptional() @IsEnum(['home', 'business'])
  audience?: 'home' | 'business';

  @ApiPropertyOptional()
  @IsOptional() @IsObject()
  customFields?: Record<string, string>;
}

// ── Response ──────────────────────────────────────────────────────────────────

export class PageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty() title: string;
  @ApiProperty() slug: string;
  @ApiProperty({ nullable: true }) urlPath: string | null;
  @ApiProperty({ enum: PageStatus }) status: PageStatus;
  @ApiProperty({ nullable: true }) templateId: string | null;
  @ApiProperty() content: Record<string, unknown>;
  @ApiProperty({ nullable: true }) previewHtml: string | null;
  @ApiProperty({ nullable: true }) seoTitle: string | null;
  @ApiProperty({ nullable: true }) seoDescription: string | null;
  @ApiProperty({ nullable: true }) seoKeywords: string | null;
  @ApiProperty({ nullable: true }) ogTitle: string | null;
  @ApiProperty({ nullable: true }) ogDescription: string | null;
  @ApiProperty({ nullable: true }) ogImageUrl: string | null;
  @ApiProperty({ nullable: true }) canonicalUrl: string | null;
  @ApiProperty() robots: string;
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
