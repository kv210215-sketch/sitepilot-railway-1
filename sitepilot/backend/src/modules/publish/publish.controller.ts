import {
  Controller, Get, Post, Patch, Body, Param,
  Query, HttpCode, HttpStatus, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { PublishService } from './publish.service';
import {
  CreatePublishJobDto, ListJobsDto,
  PublishJobResponseDto, PaginatedJobsDto,
} from './publish.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser }  from '../common/decorators/current-user.decorator';
import { RequestUser }  from '../auth/jwt.strategy';

@ApiTags('Publish')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/publish')
export class PublishController {
  constructor(private readonly svc: PublishService) {}

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
}
