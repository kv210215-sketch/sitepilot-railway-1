import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService, AuditQueryDto } from './audit.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
