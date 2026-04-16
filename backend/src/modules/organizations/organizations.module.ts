import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrgRolesGuard } from '../common/guards/org-roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMember])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrgRolesGuard],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
