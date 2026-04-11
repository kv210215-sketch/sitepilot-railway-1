import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum BillingPlan {
  FREE    = 'free',
  STARTER = 'starter',
  PRO     = 'pro',
  AGENCY  = 'agency',
}

export enum SubscriptionStatus {
  ACTIVE    = 'active',
  TRIALING  = 'trialing',
  PAST_DUE  = 'past_due',
  CANCELED  = 'canceled',
  INACTIVE  = 'inactive',
}

export const PLAN_PRICES: Record<BillingPlan, { monthly: number; priceId: string }> = {
  [BillingPlan.FREE]:    { monthly: 0,   priceId: '' },
  [BillingPlan.STARTER]: { monthly: 29,  priceId: process.env.STRIPE_PRICE_STARTER ?? '' },
  [BillingPlan.PRO]:     { monthly: 99,  priceId: process.env.STRIPE_PRICE_PRO ?? '' },
  [BillingPlan.AGENCY]:  { monthly: 299, priceId: process.env.STRIPE_PRICE_AGENCY ?? '' },
};

export const PLAN_LIMITS: Record<BillingPlan, { projects: number; pages: number; publishJobs: number }> = {
  [BillingPlan.FREE]:    { projects: 1,   pages: 10,   publishJobs: 5 },
  [BillingPlan.STARTER]: { projects: 3,   pages: 100,  publishJobs: 50 },
  [BillingPlan.PRO]:     { projects: 10,  pages: 500,  publishJobs: 500 },
  [BillingPlan.AGENCY]:  { projects: 999, pages: 9999, publishJobs: 9999 },
};

@Entity('subscriptions')
@Index(['userId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: BillingPlan, default: BillingPlan.FREE })
  plan: BillingPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.INACTIVE })
  status: SubscriptionStatus;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string | null;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string | null;

  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string | null;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'trial_end', type: 'timestamptz', nullable: true })
  trialEnd: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
