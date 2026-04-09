// =============================================================================
// Sprint 2 — pages.service.ts ADDITIONS
// Додайте ці методи до існуючого PagesService (sprint1)
// =============================================================================

// ── Додати до PagesService ────────────────────────────────────────────────────

/*
  async exportForTilda(projectId: string, pageId: string): Promise<TildaExportDto>
  async bulkGenerate(projectId: string, dto: BulkGenerateDto, userId: string): Promise<PageResponseDto[]>
*/

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Page, PageStatus } from './page.entity';
import { SeoService } from '../seo/seo.service';
import { TemplatesService } from '../templates/templates.service';
import { ContentService } from '../content/content.service';
import { GeneratePageDto } from './pages.dto';
import { PreviewRenderer } from './preview.renderer';

export interface TildaExportDto {
  pageTitle:   string;
  slug:        string;
  urlPath:     string;
  seo: {
    title:       string;
    description: string;
    keywords:    string;
    ogTitle:     string;
    ogDescription: string;
  };
  blocks: Array<{
    order:          number;
    type:           string;
    tildaBlockName: string;
    instructions:   string;
    fields:         Record<string, string>;
  }>;
  totalBlocks: number;
  estimatedMinutes: number;
}

export interface BulkGenerateDto {
  templateId: string;
  cities:     string[];
  audience?:  'home' | 'business';
  power?:     number;
  titlePattern: string;  // "СЕС для {{audience}} у {{city}}"
}

@Injectable()
export class PagesServiceV2 {
  private readonly logger = new Logger('PagesServiceV2');

  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    private readonly seoService: SeoService,
    private readonly templatesService: TemplatesService,
    private readonly contentService: ContentService,
    private readonly renderer: PreviewRenderer,
  ) {}

  // ── Export для Tilda (MVP Спринт 5) ──────────────────────────────────────

  async exportForTilda(projectId: string, pageId: string): Promise<TildaExportDto> {
    const page = await this.pageRepo.findOne({ where: { id: pageId, projectId } });
    if (!page) throw new NotFoundException('Сторінку не знайдено');

    const TILDA_BLOCK_MAP: Record<string, string> = {
      hero:       'BS102 — Hero з великим заголовком і кнопкою',
      pain:       'BF701 — Таблиця переваг / порівняння',
      steps:      'BL31  — Кроки / процес (горизонтальний)',
      numbers:    'BS601 — Цифри і факти',
      audience:   'BT10  — Два стовпці тексту',
      guarantees: 'BF401 — Список з іконками',
      offers:     'BT711 — Картки з описом і кнопкою',
      cta:        'BC501 — CTA з формою',
      faq:        'BF200 — Акордеон FAQ',
    };

    const MINUTES_PER_BLOCK = 2;

    const blocks = (page.content?.blocks ?? []).map((b: any) => ({
      order:          b.order,
      type:           b.type,
      tildaBlockName: TILDA_BLOCK_MAP[b.type] ?? `Блок типу "${b.type}"`,
      instructions:   this.buildTildaInstruction(b.type, b.data),
      fields:         this.flattenBlockData(b.data),
    }));

    return {
      pageTitle: page.title,
      slug:      page.slug,
      urlPath:   page.urlPath ?? `/${page.slug}`,
      seo: {
        title:         page.seoTitle        ?? '',
        description:   page.seoDescription  ?? '',
        keywords:      page.seoKeywords     ?? '',
        ogTitle:       page.ogTitle         ?? '',
        ogDescription: page.ogDescription   ?? '',
      },
      blocks,
      totalBlocks:      blocks.length,
      estimatedMinutes: blocks.length * MINUTES_PER_BLOCK,
    };
  }

  // ── Масова генерація (SEO сторінки під міста) ─────────────────────────────

  async bulkGenerate(
    projectId: string,
    dto:       BulkGenerateDto,
    userId:    string,
  ): Promise<{ created: number; pages: Array<{ city: string; slug: string; id: string }> }> {
    const template = await this.templatesService.findById(dto.templateId);
    const content  = await this.contentService.getContentData();
    const results: Array<{ city: string; slug: string; id: string }> = [];

    for (const city of dto.cities) {
      const title = dto.titlePattern
        .replace('{{city}}',     city)
        .replace('{{audience}}', dto.audience === 'business' ? 'бізнесу' : 'дому')
        .replace('{{power}}',    dto.power ? `${dto.power} кВт` : '');

      const blocks = this.templatesService.buildBlocks(template, {
        content: content as unknown as Record<string, unknown>,
        city,
        power:    dto.power,
        audience: dto.audience,
      });

      const seo  = this.seoService.generate({ title, city, power: dto.power, audience: dto.audience });
      const slug = await this.resolveSlug(projectId, seo.slug);

      const page = this.pageRepo.create({
        projectId,
        templateId:     dto.templateId,
        title,
        slug,
        urlPath:        `/${slug}`,
        status:         PageStatus.GENERATED,
        content:        { blocks },
        previewHtml:    null,
        seoTitle:       seo.seoTitle,
        seoDescription: seo.seoDescription,
        seoKeywords:    seo.seoKeywords,
        ogTitle:        seo.ogTitle,
        ogDescription:  seo.ogDescription,
        createdBy:      userId,
        updatedBy:      userId,
      });

      await this.pageRepo.save(page);
      results.push({ city, slug: page.slug, id: page.id });
      this.logger.log(`Bulk generated: "${title}" → /${slug}`);
    }

    return { created: results.length, pages: results };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resolveSlug(projectId: string, slug: string): Promise<string> {
    const existing = await this.pageRepo.find({
      where: { projectId }, select: ['slug'],
    });
    return this.seoService.makeUniqueSlug(slug, existing.map(p => p.slug));
  }

  private buildTildaInstruction(type: string, data: any): string {
    switch (type) {
      case 'hero':
        return `1. Додайте блок ${type}\n2. Заголовок: "${data.title ?? ''}"\n3. Підзаголовок: "${data.subtitle ?? ''}"\n4. Кнопка: "${data.cta ?? ''}"`;
      case 'pain':
        return `1. Додайте таблицю 2 колонки\n2. Ліва колонка — "Проблема", права — "Рішення"\n3. Заповніть ${(data.items ?? []).length} рядків`;
      case 'cta':
        return `1. Додайте CTA блок з формою\n2. Заголовок: "${data.title ?? ''}"\n3. Текст: "${data.text ?? ''}"\n4. Кнопка: "${data.button ?? ''}"`;
      default:
        return `Заповніть блок "${type}" відповідно до полів нижче`;
    }
  }

  private flattenBlockData(data: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    const flatten = (obj: any, prefix = '') => {
      for (const [k, v] of Object.entries(obj ?? {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string' || typeof v === 'number') {
          result[key] = String(v);
        } else if (Array.isArray(v)) {
          v.forEach((item, i) => {
            if (typeof item === 'string') result[`${key}[${i}]`] = item;
            else if (typeof item === 'object') flatten(item, `${key}[${i}]`);
          });
        } else if (typeof v === 'object') {
          flatten(v, key);
        }
      }
    };
    flatten(data);
    return result;
  }
}
