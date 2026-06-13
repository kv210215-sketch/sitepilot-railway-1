import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService, AuditQueryDto, GlobalFeedQueryDto } from './audit.service';
import { JwtAuthGuard } from '../auth/guards';
import { ProjectAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';

// Project-scoped activity feed: ProjectAccessGuard resolves :projectId → org
// membership so only members of the project's organization can read it.
// @ProjectRoles() with no args = any active member. Without this guard the
// route is an IDOR — any authenticated user could read another tenant's feed.
@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@ProjectRoles()
@ApiResponse({ status: 403, description: 'Not a member of the project organization' })
@Controller('projects/:projectId/activity')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Журнал активності проєкту' })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: AuditQueryDto,
  ) {
    return this.svc.list(projectId, query);
  }
}

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class GlobalActivityController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Глобальна стрічка активності користувача (dashboard)' })
  feed(@CurrentUser() user: RequestUser, @Query() query: GlobalFeedQueryDto) {
    return this.svc.globalFeed(user.id, query.limit);
  }
}
