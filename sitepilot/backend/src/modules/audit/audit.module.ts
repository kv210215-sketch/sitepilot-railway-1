import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditService }    from './audit.service';
import { AuditLog }        from './audit-log.entity';
import { ProjectsModule }  from '../projects/projects.module';

@Module({
  imports:     [TypeOrmModule.forFeature([AuditLog]), ProjectsModule],
  controllers: [AuditController],
  providers:   [AuditService],
  exports:     [AuditService],
})
export class AuditModule {}
