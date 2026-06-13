import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController, GlobalActivityController } from './audit.controller';
import { AuditService }    from './audit.service';
import { AuditLog }        from './audit-log.entity';
import { Project }         from '../projects/project.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

@Module({
  imports:     [TypeOrmModule.forFeature([AuditLog, Project, OrganizationMember])],
  controllers: [AuditController, GlobalActivityController],
  providers:   [AuditService, ProjectAccessGuard],
  exports:     [AuditService],
})
export class AuditModule {}
