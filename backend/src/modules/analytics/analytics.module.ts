import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Project } from '../projects/project.entity';
import { Page } from '../pages/page.entity';
import { PublishJob } from '../publish/publish-job.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([Project, Page, PublishJob])],
  controllers: [AnalyticsController],
  providers:   [AnalyticsService],
  exports:     [AnalyticsService],
})
export class AnalyticsModule {}
