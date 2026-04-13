import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OnboardingStep, BusinessType, BusinessGoal } from './onboarding.entity';

export class StartResponseDto {
  @ApiProperty() sessionId: string;
  @ApiProperty({ enum: OnboardingStep }) step: OnboardingStep;
  @ApiProperty() message: string;
}

export class SetTypeDto {
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty({ enum: BusinessType }) @IsEnum(BusinessType) type: BusinessType;
}

export class SetGoalDto {
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty({ enum: BusinessGoal }) @IsEnum(BusinessGoal) goal: BusinessGoal;
}

export class SetDataDto {
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty({ example: 'Solomiya Energy' }) @IsString() name: string;
  @ApiProperty({ example: 'Київ' })             @IsString() city: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail()  email?: string;
}

export class SessionStepDto {
  @ApiProperty() @IsString() sessionId: string;
}

export class OnboardingStatusDto {
  @ApiProperty() sessionId:  string;
  @ApiProperty({ enum: OnboardingStep }) step: OnboardingStep;
  @ApiProperty() completed:  boolean;
  @ApiProperty() published:  boolean;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) generatedSite?: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) data?: Record<string, unknown>;
}

export class OnboardingStepResponseDto {
  @ApiProperty() sessionId:  string;
  @ApiProperty({ enum: OnboardingStep }) step: OnboardingStep;
  @ApiProperty() message:    string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) payload?: Record<string, unknown>;
}
