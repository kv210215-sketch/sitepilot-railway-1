// =============================================================================
// Sprint 2 — Додати ці endpoints до існуючого PagesController
// =============================================================================

import {
  Controller, Get, Post, Body, Param,
  ParseUUIDPipe, UseGuards, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard }    from '../auth/guards';
import { CurrentUser }     from '../common/decorators/current-user.decorator';
import { RequestUser }     from '../auth/jwt.strategy';
import { PagesServiceV2, BulkGenerateDto } from './pages.service.additions';
import { IsArray, IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BulkGenerateDtoValidator {
  @ApiProperty() @IsString() templateId:    string;
  @ApiProperty({ type: [String], example: ['Львів','Київ','Харків'] })
  @IsArray() @IsString({ each: true })      cities: string[];
  @ApiPropertyOptional({ enum: ['home','business'] })
  @IsOptional() @IsEnum(['home','business']) audience?: 'home' | 'business';
  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) power?: number;
  @ApiProperty({ example: 'СЕС для {{audience}} у {{city}}' })
  @IsString() titlePattern: string;
}

@ApiTags('Pages — Sprint 2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/pages')
export class PagesControllerV2 {
  constructor(private readonly svc: PagesServiceV2) {}

  // ── Масова генерація SEO-сторінок ─────────────────────────────────────────
  @Post('bulk-generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Масова генерація сторінок (міста × шаблон)' })
  bulkGenerate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: BulkGenerateDtoValidator,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.bulkGenerate(projectId, dto as BulkGenerateDto, user.id);
  }

  // ── Export для Tilda ───────────────────────────────────────────────────────
  @Get(':pageId/export-tilda')
  @ApiOperation({ summary: 'Export сторінки у форматі інструкції для Tilda' })
  exportTilda(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
  ) {
    return this.svc.exportForTilda(projectId, pageId);
  }

  // ── Preview як HTML (Content-Type: text/html) ──────────────────────────────
  @Get(':pageId/preview-html')
  @ApiOperation({ summary: 'Preview сторінки як чистий HTML' })
  async previewHtml(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @Res() res: Response,
  ) {
    const result = await this.svc.exportForTilda(projectId, pageId);
    // Повертаємо з'єднаний preview — в реальному коді тут буде PreviewRenderer
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<html><body><pre>${JSON.stringify(result, null, 2)}</pre></body></html>`);
  }
}
