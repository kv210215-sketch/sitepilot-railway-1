import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, Query, HttpCode, HttpStatus, UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiResponse, ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { PageAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { OrgRole } from '../organizations/entities/organization-member.entity';

import { PagesService } from './pages.service';
import {
  CreatePageDto, UpdatePageDto, ListPagesQueryDto,
  PageResponseDto, PaginatedPagesDto,
} from './pages.dto';

// ── Standalone controller: /pages ─────────────────────────────────────────────
// Routes that reference a page by :id use PageAccessGuard (resolves page→project→org).
// GET /pages (list) has no :id — service filters by org membership.
// POST /pages requires organizationId to be derived from projectId in the body.

@ApiTags('Pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  // ── GET /pages ────────────────────────────────────────────────────────────────
  // Returns all pages accessible to the user (via org membership).
  // Supports filter by projectId, pageType, status, isHomepage, search.

  @Get()
  @ApiOperation({ summary: 'Всі сторінки доступних проєктів' })
  @ApiResponse({ status: 200, type: PaginatedPagesDto })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListPagesQueryDto,
  ): Promise<PaginatedPagesDto> {
    return this.pages.list(user.id, user.role, query);
  }

  // ── POST /pages ───────────────────────────────────────────────────────────────
  // projectId is required in the body. Service checks ADMIN/OWNER membership.

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Створити сторінку (admin або owner org)' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  @ApiResponse({ status: 403, description: 'Requires org admin or owner role' })
  @ApiResponse({ status: 409, description: 'Slug/path conflict' })
  create(
    @Body() dto: CreatePageDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.create(dto, user.id, user.role);
  }

  // ── GET /pages/:id ────────────────────────────────────────────────────────────

  @Get(':id')
  @UseGuards(PageAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Деталі сторінки' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this page\'s organization' })
  @ApiResponse({ status: 404 })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.getOne(id, user.id, user.role);
  }

  // ── PATCH /pages/:id ──────────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(PageAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @ApiOperation({ summary: 'Оновити сторінку (admin або owner org)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 409, description: 'Slug/path conflict' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PageResponseDto> {
    return this.pages.update(id, dto, user.id, user.role);
  }

  // ── DELETE /pages/:id ─────────────────────────────────────────────────────────

  @Delete(':id')
  @UseGuards(PageAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити сторінку (soft delete, admin або owner org)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string }> {
    return this.pages.remove(id, user.id, user.role);
  }
}
