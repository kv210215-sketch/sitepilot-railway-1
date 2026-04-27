import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, Query, HttpCode, HttpStatus, UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiResponse, ApiProperty, ApiPropertyOptional, ApiParam,
} from '@nestjs/swagger';
import { IsArray, IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { ProjectAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { OrgRole } from '../organizations/entities/organization-member.entity';

import { PagesService, BulkGenerateDto } from './pages.service';
import {
  CreatePageDto, UpdatePageDto, ListPagesQueryDto,
  GeneratePageDto, PageResponseDto, PaginatedPagesDto,
} from './pages.dto';

// ── Sprint 2: Bulk generate DTO validator (local to this controller) ──────────

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

// ── Nested controller: /projects/:projectId/pages ─────────────────────────────
// ProjectAccessGuard at class level protects all routes.
// Any-member for reads; ADMIN/OWNER for writes.

@ApiTags('Pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/pages')
export class ProjectPagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Список сторінок проєкту' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PaginatedPagesDto })
  @ApiResponse({ status: 403 })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
    @Query() query: ListPagesQueryDto,
  ): Promise<PaginatedPagesDto> {
    return this.pages.listByProject(projectId, user.id, user.role, query);
  }

  @Get(':pageId')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Деталі сторінки' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'pageId',    type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.getOne(pageId, user.id, user.role);
  }

  @Post()
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Створити сторінку в проєкті (admin або owner)' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 409, description: 'Slug/path conflict' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreatePageDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.create({ ...dto, projectId }, user.id, user.role);
  }

  @Patch(':pageId')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @ApiOperation({ summary: 'Оновити сторінку (admin або owner)' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'pageId',    type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  update(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:     string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.update(pageId, dto, user.id, user.role);
  }

  @Delete(':pageId')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити сторінку (soft delete, admin або owner)' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'pageId',    type: String, format: 'uuid' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:     string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string }> {
    return this.pages.remove(pageId, user.id, user.role);
  }

  // ── Sprint 2: Generate, Bulk, Preview, Tilda ──────────────────────────────────

  @Post('generate')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Згенерувати сторінку з шаблону' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  generate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: GeneratePageDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.generateFromTemplate(projectId, dto, user.id, user.role);
  }

  @Post('bulk-generate')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Масова генерація сторінок (міста × шаблон)' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  bulkGenerate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: BulkGenerateDtoValidator,
    @CurrentUser() user: RequestUser,
  ) {
    return this.pages.bulkGenerate(projectId, dto as BulkGenerateDto, user.id, user.role);
  }

  @Post(':pageId/regenerate-seo')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @ApiOperation({ summary: 'Перегенерувати SEO автоматично' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'pageId',    type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  regenerateSeo(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.regenerateSeo(projectId, pageId, user.id, user.role);
  }

  @Get(':pageId/preview')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'HTML preview сторінки' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'pageId',    type: String, format: 'uuid' })
  preview(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ html: string }> {
    return this.pages.getPreview(projectId, pageId, user.id, user.role);
  }

  @Get(':pageId/export-tilda')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Export сторінки у форматі інструкції для Tilda' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'pageId',    type: String, format: 'uuid' })
  exportTilda(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId',    ParseUUIDPipe) pageId:    string,
    @CurrentUser() user: RequestUser,
  ): Promise<TildaExportDto> {
    return this.pages.exportForTilda(projectId, pageId, user.id, user.role);
  }
}

// Import needed for the export-tilda return type
import { TildaExportDto } from './pages.service';
