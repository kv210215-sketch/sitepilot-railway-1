import {
  Controller, Post, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AiService } from './ai.service';
import {
  GenerateSiteDto, GeneratedSiteDto,
  ChatMessageDto, ChatResponseDto,
} from './ai.dto';
import { JwtAuthGuard } from '../auth/guards';
import { SubscriptionGuard, RequiredPlan } from '../billing/subscription.guard';
import { BillingPlan } from '../billing/billing.entity';

@ApiTags('AI Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('generate-site')
  @HttpCode(HttpStatus.CREATED)
  @RequiredPlan(BillingPlan.STARTER, BillingPlan.PRO, BillingPlan.AGENCY)
  @ApiOperation({ summary: 'AI: Generate full site structure from business params' })
  @ApiResponse({ status: 201, type: GeneratedSiteDto })
  generateSite(@Body() dto: GenerateSiteDto): Promise<GeneratedSiteDto> {
    return this.ai.generateSite(dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI Sales Agent: qualify and calculate for client' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  chat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.ai.chat(dto);
  }
}
