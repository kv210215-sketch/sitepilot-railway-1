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
import { JwtAuthGuard, ProjectRoleGuard, ProjectRoles } from '../auth/guards';
import { UserRole } from './project-member.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Список проєктів поточного користувача' })
  @ApiResponse({ status: 200, type: PaginatedProjectsDto })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListProjectsDto,
  ): Promise<PaginatedProjectsDto> {
    return this.projectsService.listForUser(user.id, query);
  }

  @Get(':projectId')
  @UseGuards(ProjectRoleGuard)
  @ApiOperation({ summary: 'Деталі проєкту' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Не є учасником проєкту' })
  @ApiResponse({ status: 404, description: 'Проєкт не знайдено' })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.getOne(projectId, user.id);
  }

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

  @Patch(':projectId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Оновити проєкт (owner / manager)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Потрібна роль owner або manager' })
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(projectId, dto, user.id);
  }

  @Patch(':projectId/archive')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(UserRole.OWNER)
  @ApiOperation({ summary: 'Архівувати проєкт (тільки owner)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Потрібна роль owner' })
  archive(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.archive(projectId, user.id);
  }

  @Delete(':projectId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити проєкт (soft delete, тільки owner)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Потрібна роль owner' })
  remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.remove(projectId, user.id);
  }

  @Get(':projectId/members')
  @UseGuards(ProjectRoleGuard)
  @ApiOperation({ summary: 'Учасники проєкту' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Не є учасником проєкту' })
  getMembers(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.getMembers(projectId, user.id);
  }

  @Post(':projectId/members')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(UserRole.OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Додати учасника (owner / manager)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Потрібна роль owner або manager' })
  addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.addMember(projectId, dto, user.id);
  }

  @Patch(':projectId/members/:memberId/role')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(UserRole.OWNER)
  @ApiOperation({ summary: 'Змінити роль учасника (тільки owner)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Потрібна роль owner' })
  updateMemberRole(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.updateMemberRole(projectId, memberId, dto, user.id);
  }

  @Delete(':projectId/members/:memberId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(UserRole.OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Видалити учасника (owner / manager)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Потрібна роль owner або manager' })
  removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projectsService.removeMember(projectId, memberId, user.id);
  }
}
