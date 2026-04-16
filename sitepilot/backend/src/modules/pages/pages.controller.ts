import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, Query, HttpCode, HttpStatus, UseGuards,
  ParseUUIDPipe, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Response } from 'express';
import { IsArray, IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { PagesService, BulkGenerateDto } from './pages.service';
import {
  CreatePageDto, UpdatePageDto, ListPagesDto, GeneratePageDto,
  PageResponseDto, PaginatedPagesDto,
} from './pages.dto';
import { JwtAuthGuard, OrgRolesGuard, Roles } from '../auth/guards';
import { UserRole } from '../projects/project-member.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';

class BulkGenerateDtoValidator {
  @ApiProperty() @IsString() templateId: string;
  @ApiProperty({ type: [String], example: ['Львів', 'Київ', 'Харків'] })
  @IsArray() @IsString({ each: true }) cities: string[];
  @ApiPropertyOptional({ enum: ['home', 'business'] })
  @IsOptional() @IsEnum(['home', 'business']) audience?: 'home' | 'business';
  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) power?: number;
  @ApiProperty({ example: 'СЕС для {{audience}} у {{city}}' })
  @IsString() titlePattern: string;
}

@ApiTags('Pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgRolesGuard)
@Controller('projects/:projectId/pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  // ── Sprint 1: Core CRUD ───────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Список сторінок проєкту' })
  @ApiResponse({ status: 200, type: PaginatedPagesDto })
  @ApiResponse({ status: 403, description: 'Не є учасником проєкту' })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListPagesDto,
  ) {
    return this.pages.list(projectId, query);
  }

  @Get(':pageId')
  @ApiOperation({ summary: 'Деталі сторінки' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
  ) {
    return this.pages.getOne(projectId, pageId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EDITOR, UserRole.TECHNICAL)
  @ApiOperation({ summary: 'Створити порожню сторінку' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  @ApiResponse({ status: 403, description: 'Потрібна роль editor або вище' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreatePageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.pages.create(projectId, dto, user.id);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EDITOR, UserRole.TECHNICAL)
  @ApiOperation({ summary: 'Згенерувати сторінку з шаблону' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  generate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: GeneratePageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.pages.generateFromTemplate(projectId, dto, user.id);
  }

  @Patch(':pageId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EDITOR, UserRole.TECHNICAL)
  @ApiOperation({ summary: 'Оновити сторінку (контент + SEO)' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.pages.update(projectId, pageId, dto, user.id);
  }

  @Post(':pageId/regenerate-seo')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EDITOR, UserRole.TECHNICAL)
  @ApiOperation({ summary: 'Перегенерувати SEO автоматично' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  regenerateSeo(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.pages.regenerateSeo(projectId, pageId, user.id);
  }

  @Get(':pageId/preview')
  @ApiOperation({ summary: 'HTML preview сторінки' })
  preview(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
  ) {
    return this.pages.getPreview(projectId, pageId);
  }

  @Patch(':pageId/archive')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Архівувати сторінку' })
  @ApiResponse({ status: 403, description: 'Потрібна роль manager або owner' })
  archive(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
  ) {
    return this.pages.archive(projectId, pageId);
  }

  @Delete(':pageId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити сторінку (soft delete)' })
  @ApiResponse({ status: 403, description: 'Потрібна роль manager або owner' })
  remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
  ) {
    return this.pages.remove(projectId, pageId);
  }

  // ── Sprint 2: Bulk + Export ───────────────────────────────────────────────

  @Post('bulk-generate')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Масова генерація сторінок (міста × шаблон)' })
  @ApiResponse({ status: 403, description: 'Потрібна роль manager або owner' })
  bulkGenerate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: BulkGenerateDtoValidator,
    @CurrentUser() user: RequestUser,
  ) {
    return this.pages.bulkGenerate(projectId, dto as BulkGenerateDto, user.id);
  }

  @Get(':pageId/export-tilda')
  @ApiOperation({ summary: 'Export сторінки у форматі інструкції для Tilda' })
  exportTilda(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
  ) {
    return this.pages.exportForTilda(projectId, pageId);
  }

  @Get(':pageId/preview-html')
  @ApiOperation({ summary: 'Preview сторінки як чистий HTML' })
  async previewHtml(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @Res() res: Response,
  ) {
    const result = await this.pages.getPreview(projectId, pageId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result.html);
  }
}
