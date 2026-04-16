import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectRoleGuard } from '../auth/guards';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember])],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRoleGuard],
  exports: [ProjectsService, ProjectRoleGuard],
})
export class ProjectsModule {}
