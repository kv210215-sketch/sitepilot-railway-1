import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Page } from '../pages/page.entity';
import { Project } from '../projects/project.entity';
import { PublicCatalogController } from './public-catalog.controller';
import { PublicPagesController } from './public-pages.controller';
import { PublicPagesService } from './public-pages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Project])],
  controllers: [PublicPagesController, PublicCatalogController],
  providers: [PublicPagesService],
  exports: [PublicPagesService],
})
export class PublicModule {}
