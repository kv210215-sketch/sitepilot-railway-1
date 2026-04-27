import {
  Controller, Post, Get, Body, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { OnboardingService } from './onboarding.service';
import {
  StartResponseDto, SetTypeDto, SetGoalDto, SetDataDto, SessionStepDto,
  OnboardingStatusDto, OnboardingStepResponseDto,
} from './onboarding.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { Public } from '../auth/guards';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  // ── POST /onboarding/start ────────────────────────────────────────────────

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start onboarding session (auth optional)' })
  @ApiResponse({ status: 201, type: StartResponseDto })
  start(@CurrentUser() user?: RequestUser): Promise<StartResponseDto> {
    return this.svc.start(user?.id);
  }

  // ── POST /onboarding/type ─────────────────────────────────────────────────

  @Post('type')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 2: Set business type (solar/services/other)' })
  @ApiResponse({ status: 200, type: OnboardingStepResponseDto })
  setType(@Body() dto: SetTypeDto): Promise<OnboardingStepResponseDto> {
    return this.svc.setType(dto);
  }

  // ── POST /onboarding/goal ─────────────────────────────────────────────────

  @Post('goal')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 3: Set business goal (leads/sales/reserve)' })
  @ApiResponse({ status: 200, type: OnboardingStepResponseDto })
  setGoal(@Body() dto: SetGoalDto): Promise<OnboardingStepResponseDto> {
    return this.svc.setGoal(dto);
  }

  // ── POST /onboarding/data ─────────────────────────────────────────────────

  @Post('data')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 4: Set business data (name, city, phone, email)' })
  @ApiResponse({ status: 200, type: OnboardingStepResponseDto })
  setData(@Body() dto: SetDataDto): Promise<OnboardingStepResponseDto> {
    return this.svc.setData(dto);
  }

  // ── POST /onboarding/generate ─────────────────────────────────────────────

  @Post('generate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 5: AI generates site structure' })
  @ApiResponse({ status: 200, type: OnboardingStepResponseDto })
  generate(@Body() dto: SessionStepDto): Promise<OnboardingStepResponseDto> {
    return this.svc.generate(dto);
  }

  // ── POST /onboarding/publish ──────────────────────────────────────────────

  @Post('publish')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 6: Publish generated site' })
  @ApiResponse({ status: 200, type: OnboardingStepResponseDto })
  publish(@Body() dto: SessionStepDto): Promise<OnboardingStepResponseDto> {
    return this.svc.publish(dto);
  }

  // ── GET /onboarding/status ────────────────────────────────────────────────

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Get onboarding session status' })
  @ApiQuery({ name: 'sessionId', required: true })
  @ApiResponse({ status: 200, type: OnboardingStatusDto })
  getStatus(@Query('sessionId') sessionId: string): Promise<OnboardingStatusDto> {
    return this.svc.getStatus(sessionId);
  }
}
