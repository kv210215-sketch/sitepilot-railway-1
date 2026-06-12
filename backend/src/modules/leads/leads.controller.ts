import {
  Controller, Get, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { ProjectAccessGuard, ProjectRoles } from '../common/guards/project-access.guard';
import { LeadsService } from './leads.service';
import {
  ListLeadsQueryDto, LeadResponseDto, PaginatedLeadsDto,
} from './leads.dto';

/**
 * Dashboard read API for leads. Project-scoped and access-controlled:
 * ProjectAccessGuard resolves :projectId → org membership, so only members of
 * the project's organization can read its leads. (@ProjectRoles() with no args
 * = any active member.)
 */
@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Список лідів проєкту (будь-який member org)' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: PaginatedLeadsDto })
  @ApiResponse({ status: 403, description: 'Not a member of this project\'s organization' })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListLeadsQueryDto,
  ): Promise<PaginatedLeadsDto> {
    return this.leads.list(projectId, query);
  }

  @Get(':leadId')
  @UseGuards(ProjectAccessGuard)
  @ProjectRoles()
  @ApiOperation({ summary: 'Деталі ліда' })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiParam({ name: 'leadId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: LeadResponseDto })
  @ApiResponse({ status: 404 })
  getOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('leadId', ParseUUIDPipe) leadId: string,
  ): Promise<LeadResponseDto> {
    return this.leads.getOne(projectId, leadId);
  }
}
