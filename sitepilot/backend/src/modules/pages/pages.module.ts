import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesController }  from './pages.controller';
import { PagesService }     from './pages.service';
import { PreviewRenderer }  from './preview.renderer';
import { Page }             from './page.entity';
import { SeoModule }        from '../seo/seo.module';
import { TemplatesModule }  from '../templates/templates.module';
import { ContentModule }    from '../content/content.module';
import { ProjectsModule }   from '../projects/projects.module';

@Module({
  imports:     [TypeOrmModule.forFeature([Page]), SeoModule, TemplatesModule, ContentModule, ProjectsModule],
  controllers: [PagesController],
  providers:   [PagesService, PreviewRenderer],
  exports:     [PagesService],
})
export class PagesModule {}
