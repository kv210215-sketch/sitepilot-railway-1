import {
  Controller, Get, Post, Patch, Body, Param,
  Query, HttpCode, HttpStatus, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsBoolean } from 'class-validator';

import { PublishService } from './publish.service';
import {
  CreatePublishJobDto, ListJobsDto,
  PublishJobResponseDto, PaginatedJobsDto,
} from './publish.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser }  from '../common/decorators/current-user.decorator';
import { RequestUser }  from '../auth/jwt.strategy';
import { PlaywrightService } from '../automation/playwright.service';
import { ProjectAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { OrgRole } from '../organizations/entities/organization-member.entity';

class RunPlaywrightDto {
  @ApiProperty({ description: 'Tilda project ID (numeric string)' })
  @IsString()
  tildaProjectId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  pageIds?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

@ApiTags('Publish')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@ProjectRoles(OrgRole.MEMBER, OrgRole.ADMIN, OrgRole.OWNER)
@ApiResponse({ status: 401, description: 'Unauthenticated' })
@ApiResponse({ status: 403, description: 'Not a member of the project organization' })
@Controller('projects/:projectId/publish')
export class PublishController {
  constructor(
    private readonly svc: PublishService,
    private readonly playwright: PlaywrightService,
  ) {}

  // ── Список jobs ───────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Черга публікацій проєкту' })
  @ApiResponse({ status: 200, type: PaginatedJobsDto })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListJobsDto,
  ) {
    return this.svc.list(projectId, query);
  }

  // ── Статистика ────────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Статистика публікацій проєкту' })
  stats(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.svc.getStats(projectId);
  }

  // ── Деталі одного job ─────────────────────────────────────────────────────
  @Get(':jobId')
  @ApiOperation({ summary: 'Деталі publish job' })
  @ApiResponse({ status: 200, type: PublishJobResponseDto })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
  ) {
    return this.svc.getOne(projectId, jobId);
  }

  // ── Логи job ─────────────────────────────────────────────────────────────
  @Get(':jobId/logs')
  @ApiOperation({ summary: 'Логи publish job' })
  getLogs(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
  ) {
    return this.svc.getLogs(projectId, jobId);
  }

  // ── Створити job ──────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Запустити публікацію (page / project / selected)' })
  @ApiResponse({ status: 201, type: PublishJobResponseDto })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreatePublishJobDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.create(projectId, dto, user.id);
  }

  // ── Retry ─────────────────────────────────────────────────────────────────
  @Post(':jobId/retry')
  @ApiOperation({ summary: 'Перезапустити failed job' })
  retry(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.retry(projectId, jobId, user.id);
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  @Patch(':jobId/cancel')
  @ApiOperation({ summary: 'Скасувати queued/pending job' })
  cancel(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.cancel(projectId, jobId, user.id);
  }

  // ── Playwright publish (Tilda) ────────────────────────────────────────────
  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run Playwright publish engine against Tilda' })
  runPlaywright(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Body() dto: RunPlaywrightDto,
  ) {
    return this.playwright.publishProject({
      projectId: dto.tildaProjectId,
      pageIds:   dto.pageIds,
      dryRun:    dto.dryRun,
    });
  }
}
