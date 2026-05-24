import {
  Controller, Get, Req, Headers, NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '../auth/guards';
import { PublicPageDto } from './public-page.dto';
import { PublicPagesService } from './public-pages.service';
import { normalizePublicPagePath } from './public-path.util';

/**
 * Public read API — no JWT.
 * Route is excluded from the global `api/v1` prefix (see main.ts).
 *
 * Preview tokens (HMAC, TTL) are intentionally not implemented in P0.
 * @see preview-tokens.notes.ts
 */
@ApiTags('public')
@Public()
@Controller('public/v1/pages')
export class PublicPagesController {
  constructor(private readonly publicPages: PublicPagesService) {}

  @Get('*')
  @ApiOperation({ summary: 'Get a published page by URL path (read-only)' })
  @ApiResponse({ status: 200, type: PublicPageDto })
  @ApiResponse({ status: 404, description: 'Page not found or not published' })
  @ApiResponse({ status: 503, description: 'Public API disabled' })
  async getPublishedPage(
    @Req() req: Request,
    @Headers('if-none-match') _ifNoneMatch?: string,
  ): Promise<PublicPageDto> {
    const path = this.extractPathFromRequest(req);
    const dto = await this.publicPages.getPublishedPageByPath(path);

    // TODO(P1): honor If-None-Match with etag derived from page id + updatedAt
    return dto;
  }

  /**
   * Strips `/public/v1/pages` prefix from the request URL.
   */
  private extractPathFromRequest(req: Request): string {
    const urlPath = req.path.replace(/\?.*$/, '');
    const marker = '/public/v1/pages';
    const idx = urlPath.indexOf(marker);

    if (idx === -1) {
      throw new NotFoundException('Invalid public pages path');
    }

    const suffix = urlPath.slice(idx + marker.length);
    return normalizePublicPagePath(suffix || '/');
  }
}
