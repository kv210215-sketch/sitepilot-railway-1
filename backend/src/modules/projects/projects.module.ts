import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { ProjectAccessGuard, PageAccessGuard } from '../common/guards/project-access.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, OrganizationMember]),
  ],
  controllers: [ProjectsController],
  providers:   [ProjectsService, ProjectAccessGuard, PageAccessGuard],
  exports:     [ProjectsService, ProjectAccessGuard, PageAccessGuard],
})
export class ProjectsModule {}
