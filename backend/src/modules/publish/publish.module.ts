import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PublishController } from './publish.controller';
import { PublishService }    from './publish.service';
import { PublishJob }        from './publish-job.entity';
import { PublishJobLog }     from './publish-job.entity';
import { Page }              from '../pages/page.entity';
import { Project }           from '../projects/project.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { AuditModule }       from '../audit/audit.module';
import { AutomationModule }  from '../automation/automation.module';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

@Module({
  imports:     [TypeOrmModule.forFeature([PublishJob, PublishJobLog, Page, Project, OrganizationMember]), AuditModule, AutomationModule],
  controllers: [PublishController],
  providers:   [PublishService, ProjectAccessGuard],
  exports:     [PublishService],
})
export class PublishModule {}
