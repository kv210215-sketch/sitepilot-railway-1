import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lead } from './lead.entity';
import { Project } from '../projects/project.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PublicLeadsController } from './public-leads.controller';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Project, OrganizationMember])],
  controllers: [PublicLeadsController, LeadsController],
  providers: [LeadsService, ProjectAccessGuard],
  exports: [LeadsService],
})
export class LeadsModule {}
