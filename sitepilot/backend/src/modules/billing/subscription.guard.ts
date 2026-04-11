import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService } from './billing.service';
import { BillingPlan } from './billing.entity';

export const REQUIRED_PLAN_KEY = 'requiredPlan';
export const RequiredPlan = (...plans: BillingPlan[]) =>
  SetMetadata(REQUIRED_PLAN_KEY, plans);

const PLAN_RANK: Record<BillingPlan, number> = {
  [BillingPlan.FREE]:    0,
  [BillingPlan.STARTER]: 1,
  [BillingPlan.PRO]:     2,
  [BillingPlan.AGENCY]:  3,
};

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billing: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<BillingPlan[]>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return false;

    const sub = await this.billing.getSubscription(userId);
    const userRank = PLAN_RANK[sub.plan] ?? 0;
    const minRequired = Math.min(...required.map(p => PLAN_RANK[p]));

    if (userRank < minRequired) {
      throw new ForbiddenException(
        `This feature requires a ${required.join(' or ')} plan. Current plan: ${sub.plan}`,
      );
    }

    return true;
  }
}
