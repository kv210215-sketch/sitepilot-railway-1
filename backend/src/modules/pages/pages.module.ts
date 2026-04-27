import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Page }    from './page.entity';
import { Project } from '../projects/project.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

import { PagesService }             from './pages.service';
import { PreviewRenderer }          from './preview.renderer';
import { ProjectPagesController }   from './pages.controller';
import { PagesController }          from './pages-standalone.controller';
import { ProjectAccessGuard, PageAccessGuard } from '../common/guards/project-access.guard';

import { SeoModule }       from '../seo/seo.module';
import { TemplatesModule } from '../templates/templates.module';
import { ContentModule }   from '../content/content.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, Project, OrganizationMember]),
    SeoModule,
    TemplatesModule,
    ContentModule,
  ],
  controllers: [PagesController, ProjectPagesController],
  providers:   [PagesService, PreviewRenderer, ProjectAccessGuard, PageAccessGuard],
  exports:     [PagesService],
})
export class PagesModule {}
