// ── content.controller.ts ─────────────────────────────────────────────────────
import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly svc: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'Весь маркетинг-контент (для генератора)' })
  getAll() {
    return this.svc.getContentData();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Один блок контенту за ключем' })
  getBlock(@Param('key') key: string) {
    return this.svc.getBlock(key);
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Оновити блок контенту' })
  updateBlock(@Param('key') key: string, @Body() body: { data: Record<string, unknown> }) {
    return this.svc.updateBlock(key, body.data);
  }
}
