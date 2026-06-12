import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController, GlobalActivityController } from './audit.controller';
import { AuditService }    from './audit.service';
import { AuditLog }        from './audit-log.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController, GlobalActivityController],
  providers:   [AuditService],
  exports:     [AuditService],
})
export class AuditModule {}
