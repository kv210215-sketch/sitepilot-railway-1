import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { SubscriptionGuard } from './subscription.guard';
import { Subscription } from './billing.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([Subscription])],
  controllers: [BillingController],
  providers:   [BillingService, SubscriptionGuard],
  exports:     [BillingService, SubscriptionGuard],
})
export class BillingModule {}
