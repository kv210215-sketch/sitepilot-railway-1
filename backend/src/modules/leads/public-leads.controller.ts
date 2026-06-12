import {
  Controller, Post, Body, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { Public } from '../auth/guards';
import { throttle } from '../common/throttle';
import { LeadsService } from './leads.service';
import { CreateLeadDto, CreateLeadAckDto } from './leads.dto';

/**
 * Public lead ingest — no JWT. Route is excluded from the global `api/v1`
 * prefix (see main.ts `exclude: public/v1/*`).
 *
 * Rate-limited per IP (anti-spam) on top of the honeypot handled in the service.
 * Returns a minimal ack and never echoes stored PII back on this unauth route.
 */
@ApiTags('public')
@Public()
@Controller('public/v1/leads')
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @Throttle(throttle(0.2))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a lead from a published site (public, rate-limited)' })
  @ApiResponse({ status: 201, type: CreateLeadAckDto })
  @ApiResponse({ status: 400, description: 'Validation error / no contact channel' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async submit(
    @Body() dto: CreateLeadDto,
    @Req() req: Request,
  ): Promise<CreateLeadAckDto> {
    const lead = await this.leads.createFromPublic(dto, {
      ipAddress: req.ip ?? null,
      userAgent: (req.headers['user-agent'] as string) ?? null,
      referrer:  (req.headers['referer'] as string) ?? null,
    });

    return { received: true, id: lead?.id ?? null };
  }
}
