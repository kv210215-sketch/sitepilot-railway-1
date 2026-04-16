import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService, AuditQueryDto } from './audit.service';
import { JwtAuthGuard, ProjectRoleGuard } from '../auth/guards';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectRoleGuard)
@Controller('projects/:projectId/activity')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Журнал активності проєкту' })
  @ApiResponse({ status: 403, description: 'Не є учасником проєкту' })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: AuditQueryDto,
  ) {
    return this.svc.list(projectId, query);
  }
}
