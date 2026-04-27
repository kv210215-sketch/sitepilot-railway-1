import {
  Injectable, Logger, BadRequestException, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import {
  Subscription, BillingPlan, SubscriptionStatus,
  PLAN_PRICES, PLAN_LIMITS,
} from './billing.entity';
import { CreateCheckoutDto, SubscriptionResponseDto } from './billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('billing.stripeSecretKey')?.trim() ?? '';
    this.stripe = secretKey
      ? new Stripe(secretKey, { apiVersion: '2024-06-20' })
      : null;

    if (!this.stripe) {
      this.logger.warn('Stripe secret key is not configured. Billing checkout and webhooks are disabled.');
    }
  }

  // ── Checkout session ──────────────────────────────────────────────────────

  async createCheckout(userId: string, dto: CreateCheckoutDto): Promise<{ url: string }> {
    const stripe = this.getStripe();

    if (dto.plan === BillingPlan.FREE) {
      throw new BadRequestException('Cannot checkout free plan');
    }

    const priceId = PLAN_PRICES[dto.plan].priceId;
    if (!priceId) {
      throw new BadRequestException(`Stripe price ID not configured for plan: ${dto.plan}`);
    }

    let sub = await this.subRepo.findOne({ where: { userId } });
    let customerId = sub?.stripeCustomerId ?? undefined;

    // Create customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
    }

    const frontendUrl = this.config.get<string>('app.frontendUrl') ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode:       'subscription',
      customer:   customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/account?billing=success`,
      cancel_url:  `${frontendUrl}/account?billing=cancel`,
      metadata:   { userId, plan: dto.plan },
      subscription_data: {
        metadata: { userId, plan: dto.plan },
        trial_period_days: 14,
      },
    });

    this.logger.log(`Checkout session created for user ${userId}, plan ${dto.plan}`);
    return { url: session.url! };
  }

  // ── Customer portal (manage subscription) ────────────────────────────────

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const stripe = this.getStripe();
    const sub = await this.subRepo.findOne({ where: { userId } });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException('No active Stripe customer found');
    }

    const frontendUrl = this.config.get<string>('app.frontendUrl') ?? 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripeCustomerId,
      return_url: `${frontendUrl}/account`,
    });

    return { url: session.url };
  }

  // ── Webhook handler ───────────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const stripe = this.getStripe();
    const webhookSecret = this.config.get<string>('billing.stripeWebhookSecret') ?? '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException(`Webhook error: ${msg}`);
    }

    this.logger.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.onCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        await this.syncSubscription(stripeSub);
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionDeleted(stripeSub);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.log(`Payment succeeded for customer: ${invoice.customer}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onPaymentFailed(invoice);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  // ── Get subscription ──────────────────────────────────────────────────────

  async getSubscription(userId: string): Promise<SubscriptionResponseDto> {
    let sub = await this.subRepo.findOne({ where: { userId } });

    if (!sub) {
      // Auto-create free tier
      sub = this.subRepo.create({
        userId,
        plan:   BillingPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.subRepo.save(sub);
    }

    return this.toResponse(sub);
  }

  // ── Check plan limit ──────────────────────────────────────────────────────

  async checkLimit(userId: string, resource: keyof typeof PLAN_LIMITS[BillingPlan.FREE]): Promise<boolean> {
    const sub = await this.subRepo.findOne({ where: { userId } });
    const plan = sub?.plan ?? BillingPlan.FREE;
    const limit = PLAN_LIMITS[plan][resource];
    return limit === 9999 || limit > 0;
  }

  async getPlanLimits(userId: string) {
    const sub = await this.subRepo.findOne({ where: { userId } });
    const plan = sub?.plan ?? BillingPlan.FREE;
    return { plan, limits: PLAN_LIMITS[plan] };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const stripe = this.getStripe();
    const userId = session.metadata?.userId;
    if (!userId) return;

    const stripeSubId = session.subscription as string;
    if (!stripeSubId) return;

    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    await this.syncSubscription(stripeSub, userId);
  }

  private async syncSubscription(stripeSub: Stripe.Subscription, userId?: string): Promise<void> {
    const resolvedUserId = userId ?? stripeSub.metadata?.userId;
    if (!resolvedUserId) {
      this.logger.warn(`No userId in subscription metadata: ${stripeSub.id}`);
      return;
    }

    const priceId = stripeSub.items.data[0]?.price.id ?? '';
    const plan = this.priceIdToPlan(priceId);
    const status = this.stripeStatusToLocal(stripeSub.status);

    let sub = await this.subRepo.findOne({ where: { userId: resolvedUserId } });
    if (!sub) {
      sub = this.subRepo.create({ userId: resolvedUserId });
    }

    sub.plan                  = plan;
    sub.status                = status;
    sub.stripeCustomerId      = stripeSub.customer as string;
    sub.stripeSubscriptionId  = stripeSub.id;
    sub.stripePriceId         = priceId;
    sub.currentPeriodStart    = new Date(stripeSub.current_period_start * 1000);
    sub.currentPeriodEnd      = new Date(stripeSub.current_period_end * 1000);
    sub.cancelAtPeriodEnd     = stripeSub.cancel_at_period_end;
    sub.trialEnd              = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;

    await this.subRepo.save(sub);
    this.logger.log(`Subscription synced: user=${resolvedUserId} plan=${plan} status=${status}`);
  }

  private async onSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
    const userId = stripeSub.metadata?.userId;
    if (!userId) return;

    await this.subRepo.update(
      { userId },
      { plan: BillingPlan.FREE, status: SubscriptionStatus.CANCELED, stripeSubscriptionId: null },
    );
    this.logger.log(`Subscription canceled for user: ${userId}`);
  }

  private async onPaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    await this.subRepo.update(
      { stripeCustomerId: customerId },
      { status: SubscriptionStatus.PAST_DUE },
    );
    this.logger.warn(`Payment failed for customer: ${customerId}`);
  }

  private priceIdToPlan(priceId: string): BillingPlan {
    for (const [plan, { priceId: pid }] of Object.entries(PLAN_PRICES)) {
      if (pid && pid === priceId) return plan as BillingPlan;
    }
    return BillingPlan.FREE;
  }

  private stripeStatusToLocal(status: Stripe.Subscription.Status): SubscriptionStatus {
    const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
      active:           SubscriptionStatus.ACTIVE,
      trialing:         SubscriptionStatus.TRIALING,
      past_due:         SubscriptionStatus.PAST_DUE,
      canceled:         SubscriptionStatus.CANCELED,
      unpaid:           SubscriptionStatus.PAST_DUE,
      incomplete:       SubscriptionStatus.INACTIVE,
      incomplete_expired: SubscriptionStatus.CANCELED,
    };
    return map[status] ?? SubscriptionStatus.INACTIVE;
  }

  toResponse(sub: Subscription): SubscriptionResponseDto {
    return {
      id:                sub.id,
      plan:              sub.plan,
      status:            sub.status,
      currentPeriodEnd:  sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      trialEnd:          sub.trialEnd,
      limits:            PLAN_LIMITS[sub.plan],
    };
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe billing is not configured');
    }

    return this.stripe;
  }
}
