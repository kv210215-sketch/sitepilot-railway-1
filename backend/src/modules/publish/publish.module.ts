import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PublishController } from './publish.controller';
import { PublishService }    from './publish.service';
import { PublishJob }        from './publish-job.entity';
import { PublishJobLog }     from './publish-job.entity';
import { Page }              from '../pages/page.entity';
import { AuditModule }       from '../audit/audit.module';
import { AutomationModule }  from '../automation/automation.module';

@Module({
  imports:     [TypeOrmModule.forFeature([PublishJob, PublishJobLog, Page]), AuditModule, AutomationModule],
  controllers: [PublishController],
  providers:   [PublishService],
  exports:     [PublishService],
})
export class PublishModule {}
