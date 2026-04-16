import {
  Controller, Post, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AiService } from './ai.service';
import {
  GenerateSiteDto, GeneratedSiteDto,
  ChatMessageDto, ChatResponseDto,
  SalesChatDto, SalesChatResponseDto,
  LeadQualifyDto, LeadQualifyResultDto,
  RecommendInputDto, RecommendResultDto,
  CloseLeadResponseDto,
} from './ai.dto';
import { JwtAuthGuard } from '../auth/guards';
import { SubscriptionGuard, RequiredPlan } from '../billing/subscription.guard';
import { BillingPlan } from '../billing/billing.entity';

@ApiTags('AI Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // ── Site generator (STARTER+) ─────────────────────────────────────────────

  @Post('generate-site')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SubscriptionGuard)
  @RequiredPlan(BillingPlan.STARTER, BillingPlan.PRO, BillingPlan.AGENCY)
  @ApiOperation({ summary: 'AI: Generate full site structure from business params' })
  @ApiResponse({ status: 201, type: GeneratedSiteDto })
  generateSite(@Body() dto: GenerateSiteDto): Promise<GeneratedSiteDto> {
    return this.ai.generateSite(dto);
  }

  // ── Legacy chat (all users) ───────────────────────────────────────────────

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy: AI qualify + calculate (basic)' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  chat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.ai.chat(dto);
  }

  // ── Sales chat (production Solomiya consultant) ────────────────────────────

  @Post('sales-chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI Sales Consultant: qualify → recommend → close (Solomiya Energy)' })
  @ApiResponse({ status: 200, type: SalesChatResponseDto })
  salesChat(@Body() dto: SalesChatDto): Promise<SalesChatResponseDto> {
    return this.ai.salesChat(dto);
  }

  // ── Lead qualify ──────────────────────────────────────────────────────────

  @Post('lead-qualify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract structured lead data from free-text input' })
  @ApiResponse({ status: 200, type: LeadQualifyResultDto })
  leadQualify(@Body() dto: LeadQualifyDto): LeadQualifyResultDto {
    return this.ai.leadQualify(dto.input);
  }

  // ── Recommend ─────────────────────────────────────────────────────────────

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate system recommendation (kW, inverter, battery, budget, payback)' })
  @ApiResponse({ status: 200, type: RecommendResultDto })
  recommend(@Body() dto: RecommendInputDto): RecommendResultDto {
    return this.ai.recommend(dto);
  }

  // ── Close lead ────────────────────────────────────────────────────────────

  @Post('close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get close-lead CTA message for contact collection' })
  @ApiResponse({ status: 200, type: CloseLeadResponseDto })
  closeLead(): CloseLeadResponseDto {
    return this.ai.closeLead();
  }
}
