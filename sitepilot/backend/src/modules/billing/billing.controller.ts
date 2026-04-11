import {
  Controller, Get, Post, Body, Req, Headers,
  HttpCode, HttpStatus, UseGuards, RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { BillingService } from './billing.service';
import { CreateCheckoutDto, CheckoutSessionDto, SubscriptionResponseDto } from './billing.dto';
import { JwtAuthGuard, Public } from '../auth/guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription & limits' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  getSubscription(@CurrentUser() user: RequestUser): Promise<SubscriptionResponseDto> {
    return this.billing.getSubscription(user.id);
  }

  @Post('create-checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, type: CheckoutSessionDto })
  createCheckout(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCheckoutDto,
  ): Promise<{ url: string }> {
    return this.billing.createCheckout(user.id, dto);
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @ApiResponse({ status: 200, type: CheckoutSessionDto })
  portal(@CurrentUser() user: RequestUser): Promise<{ url: string }> {
    return this.billing.createPortalSession(user.id);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler (public)' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    await this.billing.handleWebhook(req.rawBody!, signature);
    return { received: true };
  }
}
