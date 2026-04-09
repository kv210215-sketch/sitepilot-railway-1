import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import {
  CreateProjectDto, UpdateProjectDto, ListProjectsDto,
  AddMemberDto, UpdateMemberRoleDto,
  ProjectResponseDto, PaginatedProjectsDto,
} from './projects.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ── List ─────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Список проєктів поточного користувача' })
  @ApiResponse({ status: 200, type: PaginatedProjectsDto })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListProjectsDto,
  ): Promise<PaginatedProjectsDto> {
    return this.projectsService.listForUser(user.id, query);
  }

  // ── Get one ──────────────────────────────────────────────────────────────────

  @Get(':projectId')
  @ApiOperation({ summary: 'Деталі проєкту' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Проєкт не знайдено' })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.getOne(projectId, user.id);
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Створити новий проєкт' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto, user.id);
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  @Patch(':projectId')
  @ApiOperation({ summary: 'Оновити проєкт (owner / manager)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(projectId, dto, user.id);
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  @Patch(':projectId/archive')
  @ApiOperation({ summary: 'Архівувати проєкт (тільки owner)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  archive(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.archive(projectId, user.id);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  @Delete(':projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити проєкт (soft delete, тільки owner)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.remove(projectId, user.id);
  }

  // ── Members ──────────────────────────────────────────────────────────────────

  @Get(':projectId/members')
  @ApiOperation({ summary: 'Учасники проєкту' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  getMembers(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.getMembers(projectId, user.id);
  }

  @Post(':projectId/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Додати учасника (owner / manager)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.addMember(projectId, dto, user.id);
  }

  @Patch(':projectId/members/:memberId/role')
  @ApiOperation({ summary: 'Змінити роль учасника (тільки owner)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  updateMemberRole(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.updateMemberRole(projectId, memberId, dto, user.id);
  }

  @Delete(':projectId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити учасника (owner / manager)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.removeMember(projectId, memberId, user.id);
  }
}
