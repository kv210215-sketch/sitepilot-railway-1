import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesController } from './pages.controller';
import { PagesService }    from './pages.service';
import { Page }            from './page.entity';
import { SeoModule }       from '../seo/seo.module';
import { TemplatesModule } from '../templates/templates.module';
import { ContentModule }   from '../content/content.module';

@Module({
  imports:     [TypeOrmModule.forFeature([Page]), SeoModule, TemplatesModule, ContentModule],
  controllers: [PagesController],
  providers:   [PagesService],
  exports:     [PagesService],
})
export class PagesModule {}
