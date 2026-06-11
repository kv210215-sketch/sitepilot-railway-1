import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/guards';
import { PublicSitemapEntryDto } from './public-sitemap-entry.dto';
import { PublicPagesService } from './public-pages.service';

/**
 * Public catalog endpoints (sitemap feed, etc.) — no JWT.
 * Excluded from global `api/v1` prefix (see main.ts).
 */
@ApiTags('public')
@Public()
@Controller('public/v1')
export class PublicCatalogController {
  constructor(private readonly publicPages: PublicPagesService) {}

  @Get('sitemap-entries')
  @ApiOperation({ summary: 'List published pages for sitemap generation' })
  @ApiResponse({ status: 200, type: PublicSitemapEntryDto, isArray: true })
  async listSitemapEntries(): Promise<PublicSitemapEntryDto[]> {
    return this.publicPages.listPublishedSitemapEntries();
  }
}
