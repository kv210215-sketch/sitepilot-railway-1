import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SiteType {
  HOME     = 'home',
  BUSINESS = 'business',
}

export enum BudgetRange {
  SMALL  = 'small',   // < 5 kW
  MEDIUM = 'medium',  // 5-20 kW
  LARGE  = 'large',   // 20-50 kW
  XLARGE = 'xlarge',  // 50+ kW
}

export enum SiteGoal {
  LEADS         = 'leads',
  INFORM        = 'inform',
  SELL_DIRECT   = 'sell_direct',
  BRAND         = 'brand',
}

// ── Generate Site ─────────────────────────────────────────────────────────────

export class GenerateSiteDto {
  @ApiProperty({ enum: SiteType }) @IsEnum(SiteType)
  type: SiteType;

  @ApiProperty({ enum: BudgetRange }) @IsEnum(BudgetRange)
  budget: BudgetRange;

  @ApiProperty({ enum: SiteGoal }) @IsEnum(SiteGoal)
  goal: SiteGoal;

  @ApiPropertyOptional({ example: 'Львів' }) @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Min(1) @Max(1000)
  powerKw?: number;

  @ApiPropertyOptional({ example: 'Назва компанії' }) @IsOptional() @IsString()
  companyName?: string;
}

export class GeneratedSiteDto {
  @ApiProperty() projectName:  string;
  @ApiProperty() slug:         string;
  @ApiProperty() description:  string;
  @ApiProperty({ type: [Object] }) pages: GeneratedPageDto[];
  @ApiProperty() seoStrategy:  string;
  @ApiProperty() ctaStrategy:  string;
}

export class GeneratedPageDto {
  @ApiProperty() title:       string;
  @ApiProperty() slug:        string;
  @ApiProperty() description: string;
  @ApiProperty() purpose:     string;
  @ApiProperty({ type: [Object] }) blocks: GeneratedBlockDto[];
}

export class GeneratedBlockDto {
  @ApiProperty() type:  string;
  @ApiProperty() order: number;
  @ApiProperty({ type: Object }) data: Record<string, unknown>;
}

// ── Sales Agent (Chat) ────────────────────────────────────────────────────────

export class ChatMessageDto {
  @ApiProperty() @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'conv_abc123' }) @IsOptional() @IsString()
  conversationId?: string;

  @ApiPropertyOptional() @IsOptional() @IsEnum(SiteType)
  clientType?: SiteType;

  @ApiPropertyOptional({ example: 'Львів' }) @IsOptional() @IsString()
  city?: string;
}

export class ChatResponseDto {
  @ApiProperty() reply:          string;
  @ApiProperty() conversationId: string;
  @ApiProperty() stage:          'qualify' | 'calculate' | 'close' | 'book';
  @ApiPropertyOptional({ type: Object }) proposal?: ProposalDto;
  @ApiProperty() quickReplies:   string[];
}

export class ProposalDto {
  @ApiProperty() powerKw:       number;
  @ApiProperty() estimatedCost: string;
  @ApiProperty() paybackYears:  number;
  @ApiProperty() monthlySaving: string;
  @ApiProperty() annualSaving:  string;
}
