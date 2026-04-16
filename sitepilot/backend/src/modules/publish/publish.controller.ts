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
import { JwtAuthGuard, OrgRolesGuard, Roles } from '../auth/guards';
import { UserRole } from '../projects/project-member.entity';
import { CurrentUser }  from '../common/decorators/current-user.decorator';
import { RequestUser }  from '../auth/jwt.strategy';
import { PlaywrightService } from '../automation/playwright.service';

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
@UseGuards(JwtAuthGuard, OrgRolesGuard)
@Controller('projects/:projectId/publish')
export class PublishController {
  constructor(
    private readonly svc: PublishService,
    private readonly playwright: PlaywrightService,
  ) {}

  // ── Read (any member) ───────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Черга публікацій проєкту' })
  @ApiResponse({ status: 200, type: PaginatedJobsDto })
  @ApiResponse({ status: 403, description: 'Не є учасником проєкту' })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListJobsDto,
  ) {
    return this.svc.list(projectId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Статистика публікацій проєкту' })
  stats(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.svc.getStats(projectId);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Деталі publish job' })
  @ApiResponse({ status: 200, type: PublishJobResponseDto })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
  ) {
    return this.svc.getOne(projectId, jobId);
  }

  @Get(':jobId/logs')
  @ApiOperation({ summary: 'Логи publish job' })
  getLogs(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
  ) {
    return this.svc.getLogs(projectId, jobId);
  }

  // ── Write (editor+) ──────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EDITOR, UserRole.TECHNICAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Запустити публікацію (page / project / selected)' })
  @ApiResponse({ status: 201, type: PublishJobResponseDto })
  @ApiResponse({ status: 403, description: 'Потрібна роль editor або вище' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreatePublishJobDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.create(projectId, dto, user.id);
  }

  @Post(':jobId/retry')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.EDITOR, UserRole.TECHNICAL)
  @ApiOperation({ summary: 'Перезапустити failed job' })
  @ApiResponse({ status: 403, description: 'Потрібна роль editor або вище' })
  retry(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.retry(projectId, jobId, user.id);
  }

  // ── Management (manager / owner) ───────────────────────────────────────

  @Patch(':jobId/cancel')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Скасувати queued/pending job' })
  @ApiResponse({ status: 403, description: 'Потрібна роль manager або owner' })
  cancel(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('jobId',     ParseUUIDPipe) jobId:     string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.cancel(projectId, jobId, user.id);
  }

  @Post('run')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run Playwright publish engine against Tilda' })
  @ApiResponse({ status: 403, description: 'Потрібна роль manager або owner' })
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
