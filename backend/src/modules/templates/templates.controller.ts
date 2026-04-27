// ── templates.controller.ts ───────────────────────────────────────────────────
import { Controller, Get, Param, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Список шаблонів (глобальні + проєкту)' })
  list(@Query('projectId') projectId?: string) {
    return this.svc.list(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталі шаблону' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }
}
