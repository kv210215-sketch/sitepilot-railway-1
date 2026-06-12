import {
  IsString, IsOptional, IsUUID, IsEmail, IsEnum, IsBoolean,
  MinLength, MaxLength, IsInt, Min, Max, IsObject,
} from 'class-validator';
import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { LeadStatus } from './lead.entity';

// ── Public ingest ───────────────────────────────────────────────────────────────
// Body for POST /public/v1/leads. Unauthenticated; the project binding is the
// `projectId` embedded in the published form.

export class CreateLeadDto {
  @ApiProperty({ description: 'Project the form belongs to', format: 'uuid' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ example: 'Олена Коваль' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({ example: 'olena@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ example: '+380671234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({ example: 'Цікавить СЕС 10 кВт для дому' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;

  @ApiPropertyOptional({ description: 'Page id the form was rendered on', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pageId?: string;

  @ApiPropertyOptional({ description: 'URL path the form was submitted from', example: '/contact' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pagePath?: string;

  @ApiPropertyOptional({ description: 'GDPR consent flag' })
  @IsOptional()
  @IsBoolean()
  consent?: boolean;

  @ApiPropertyOptional({ description: 'utm params / referrer, stored as-is', type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  /**
   * Honeypot. Real users never see or fill this hidden field; bots do.
   * Declared so the strict global ValidationPipe (forbidNonWhitelisted) accepts
   * the request — the service silently drops submissions that fill it.
   */
  @ApiPropertyOptional({ description: 'Honeypot — leave empty', deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

/** Public ack — intentionally minimal; never echoes stored PII back unauth. */
export class CreateLeadAckDto {
  @ApiProperty({ example: true })
  received: boolean;

  @ApiProperty({ example: 'a3f1...', description: 'Lead id, or null when dropped as spam', nullable: true })
  id: string | null;
}

// ── Dashboard read ──────────────────────────────────────────────────────────────

export class ListLeadsQueryDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

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
}

export class LeadResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty({ nullable: true }) pageId: string | null;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) email: string | null;
  @ApiProperty({ nullable: true }) phone: string | null;
  @ApiProperty({ nullable: true }) message: string | null;
  @ApiProperty({ nullable: true }) pagePath: string | null;
  @ApiProperty() source: string;
  @ApiProperty() consent: boolean;
  @ApiProperty({ enum: LeadStatus }) status: LeadStatus;
  @ApiProperty({ type: 'object', additionalProperties: true }) metadata: Record<string, unknown>;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedLeadsDto {
  @ApiProperty({ type: [LeadResponseDto] }) data: LeadResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
