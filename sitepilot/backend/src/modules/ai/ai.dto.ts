import {
  IsString, IsOptional, IsEnum, IsNumber, IsBoolean,
  Min, Max, IsArray, IsEmail,
} from 'class-validator';
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

// ── Legacy Chat (kept for backward compat) ────────────────────────────────────

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

// ── Sales Chat (production AI consultant) ─────────────────────────────────────

export class SalesChatDto {
  @ApiProperty({ example: 'Привіт, цікавить СЕС для дому' }) @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'sales_abc123' }) @IsOptional() @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ enum: SiteType }) @IsOptional() @IsEnum(SiteType)
  clientType?: SiteType;

  @ApiPropertyOptional({ example: 'Київ' }) @IsOptional() @IsString()
  city?: string;
}

export class SalesChatResponseDto {
  @ApiProperty() reply:           string;
  @ApiProperty() conversationId:  string;
  @ApiProperty() stage:           string;
  @ApiProperty() quickReplies:    string[];
  @ApiPropertyOptional({ type: Object }) leadData?: LeadQualifyResultDto;
  @ApiPropertyOptional({ type: Object }) recommendation?: RecommendResultDto;
}

// ── Lead Qualify ──────────────────────────────────────────────────────────────

export class LeadQualifyDto {
  @ApiProperty({ example: 'Потрібна СЕС 10 кВт для бізнесу в Харкові, хочу АКБ' })
  @IsString()
  input: string;
}

export class LeadQualifyResultDto {
  @ApiProperty({ enum: ['business', 'home'] }) lead_type: 'business' | 'home';
  @ApiProperty({ enum: ['backup', 'saving'] }) intent:    'backup' | 'saving';
  @ApiPropertyOptional() region?:      string | null;
  @ApiPropertyOptional() consumption?: number | null;
  @ApiProperty() battery:  boolean;
  @ApiProperty({ enum: ['ground', 'roof'] }) mounting: 'ground' | 'roof';
}

// ── Recommend ─────────────────────────────────────────────────────────────────

export class RecommendInputDto {
  @ApiProperty({ enum: ['business', 'home'] }) @IsString()
  lead_type: 'business' | 'home';

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  consumption?: number;

  @ApiProperty() @IsBoolean()
  battery: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString()
  region?: string;
}

export class RecommendResultDto {
  @ApiProperty() system_kw: string;
  @ApiProperty() inverter:  string;
  @ApiProperty() battery:   string;
  @ApiProperty() budget:    string;
  @ApiProperty() payback:   string;
  @ApiProperty() next:      string;
}

// ── Close Lead ────────────────────────────────────────────────────────────────

export class CloseLeadResponseDto {
  @ApiProperty() message: string;
  @ApiProperty() cta:     string;
}
