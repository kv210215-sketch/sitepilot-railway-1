import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService, AuditQueryDto } from './audit.service';
import { JwtAuthGuard } from '../auth/guards';
import { ProjectAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { OrgRole } from '../organizations/entities/organization-member.entity';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@ProjectRoles(OrgRole.MEMBER, OrgRole.ADMIN, OrgRole.OWNER)
@ApiResponse({ status: 401, description: 'Unauthenticated' })
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
