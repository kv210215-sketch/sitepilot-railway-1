import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingPlan, SubscriptionStatus } from './billing.entity';

export class CreateCheckoutDto {
  @ApiProperty({ enum: BillingPlan, example: BillingPlan.PRO })
  @IsEnum(BillingPlan)
  plan: BillingPlan;
}

export class SubscriptionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: BillingPlan }) plan: BillingPlan;
  @ApiProperty({ enum: SubscriptionStatus }) status: SubscriptionStatus;
  @ApiPropertyOptional() currentPeriodEnd?: Date | null;
  @ApiPropertyOptional() cancelAtPeriodEnd?: boolean;
  @ApiPropertyOptional() trialEnd?: Date | null;
  @ApiProperty() limits: {
    projects: number;
    pages: number;
    publishJobs: number;
  };
}

export class CheckoutSessionDto {
  @ApiProperty() url: string;
}
