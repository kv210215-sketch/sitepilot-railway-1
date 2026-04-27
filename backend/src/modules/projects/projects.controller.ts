import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { ProjectAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { OrgRole } from '../organizations/entities/organization-member.entity';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto, UpdateProjectDto, ListProjectsQueryDto,
  ProjectResponseDto, PaginatedProjectsDto,
} from './projects.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ── GET /projects ─────────────────────────────────────────────────────────────
  // No id guard — service filters by org membership internally.

  @Get()
  @ApiOperation({ summary: 'Список проєктів, доступних користувачу' })
  @ApiResponse({ status: 200, type: PaginatedProjectsDto })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListProjectsQueryDto,
  ): Promise<PaginatedProjectsDto> {
    return this.projectsService.list(user.id, user.role, query);
  }

  // ── POST /projects ────────────────────────────────────────────────────────────
  // organizationId required in body. Service checks ADMIN/OWNER membership.

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Створити проєкт (org admin або owner)' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Requires org admin or owner role' })
  @ApiResponse({ status: 409, description: 'Slug conflict within organization' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto, user.id, user.role);
  }

  // ── GET /projects/:id ─────────────────────────────────────────────────────────

  @Get(':id')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Деталі проєкту (будь-який member org)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this project\'s organization' })
  @ApiResponse({ status: 404 })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.getOne(id, user.id, user.role);
  }

  // ── PATCH /projects/:id ───────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.ADMIN, OrgRole.OWNER)
  @ApiOperation({ summary: 'Оновити проєкт (org admin або owner)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Requires org admin or owner role' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, dto, user.id, user.role);
  }

  // ── DELETE /projects/:id ──────────────────────────────────────────────────────
  // Soft-deletes. Requires org OWNER.

  @Delete(':id')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles(OrgRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити проєкт (soft delete, тільки org owner)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Requires org owner role' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string }> {
    return this.projectsService.remove(id, user.id, user.role);
  }
}
