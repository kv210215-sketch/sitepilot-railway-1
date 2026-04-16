import {
  Injectable, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Page, PageStatus } from './page.entity';
import {
  CreatePageDto, UpdatePageDto, ListPagesDto,
  GeneratePageDto, PageResponseDto, PaginatedPagesDto,
} from './pages.dto';
import { SeoService } from '../seo/seo.service';
import { TemplatesService } from '../templates/templates.service';
import { ContentService } from '../content/content.service';
import { PreviewRenderer } from './preview.renderer';

// ── Sprint 2 interfaces ───────────────────────────────────────────────────────

export interface TildaExportDto {
  pageTitle:   string;
  slug:        string;
  urlPath:     string;
  seo: {
    title:         string;
    description:   string;
    keywords:      string;
    ogTitle:       string;
    ogDescription: string;
  };
  blocks: Array<{
    order:          number;
    type:           string;
    tildaBlockName: string;
    instructions:   string;
    fields:         Record<string, string>;
  }>;
  totalBlocks:      number;
  estimatedMinutes: number;
}

export interface BulkGenerateDto {
  templateId:   string;
  cities:       string[];
  audience?:    'home' | 'business';
  power?:       number;
  titlePattern: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    private readonly seoService: SeoService,
    private readonly templatesService: TemplatesService,
    private readonly contentService: ContentService,
    private readonly renderer: PreviewRenderer,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async list(projectId: string, query: ListPagesDto): Promise<PaginatedPagesDto> {
    const { status, search, page = 1, limit = 30, orderBy = 'sort_order' } = query;
    const skip = (page - 1) * Math.min(limit, 100);

    const qb = this.pageRepo
      .createQueryBuilder('p')
      .where('p.project_id = :projectId', { projectId })
      .andWhere('p.deleted_at IS NULL');

    if (status) qb.andWhere('p.status = :status', { status });
    if (search) qb.andWhere('p.title ILIKE :search', { search: `%${search}%` });

    const allowedOrder = ['title', 'created_at', 'updated_at', 'sort_order'];
    const col = allowedOrder.includes(orderBy) ? orderBy : 'sort_order';
    qb.orderBy(`p.${col}`, 'ASC');

    const [pages, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data:       pages.map(this.toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get one ───────────────────────────────────────────────────────────────

  async getOne(projectId: string, pageId: string): Promise<PageResponseDto> {
    const page = await this.findOne(projectId, pageId);
    return this.toResponse(page);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(projectId: string, dto: CreatePageDto, userId: string): Promise<PageResponseDto> {
    const slug = await this.resolveSlug(
      projectId,
      dto.slug ?? this.seoService.generateSlug({ title: dto.title }),
    );
    const seo = this.seoService.generate({ title: dto.title });

    const page = this.pageRepo.create({
      projectId,
      templateId:     dto.templateId ?? null,
      parentId:       dto.parentId ?? null,
      title:          dto.title,
      slug,
      urlPath:        dto.urlPath ?? `/${slug}`,
      status:         PageStatus.DRAFT,
      content:        { blocks: [] },
      seoTitle:       seo.seoTitle,
      seoDescription: seo.seoDescription,
      seoKeywords:    seo.seoKeywords,
      ogTitle:        seo.ogTitle,
      ogDescription:  seo.ogDescription,
      createdBy:      userId,
      updatedBy:      userId,
    });

    await this.pageRepo.save(page);
    this.logger.log(`Page created: ${page.id} "${page.title}" in project ${projectId}`);
    return this.toResponse(page);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(projectId: string, pageId: string, dto: UpdatePageDto, userId: string): Promise<PageResponseDto> {
    const page = await this.findOne(projectId, pageId);

    if (dto.slug && dto.slug !== page.slug) {
      dto.slug = await this.resolveSlug(projectId, dto.slug, pageId);
    }

    if (dto.seo) {
      Object.assign(page, {
        seoTitle:       dto.seo.seoTitle       ?? page.seoTitle,
        seoDescription: dto.seo.seoDescription ?? page.seoDescription,
        seoKeywords:    dto.seo.seoKeywords    ?? page.seoKeywords,
        ogTitle:        dto.seo.ogTitle        ?? page.ogTitle,
        ogDescription:  dto.seo.ogDescription  ?? page.ogDescription,
        ogImageUrl:     dto.seo.ogImageUrl     ?? page.ogImageUrl,
        canonicalUrl:   dto.seo.canonicalUrl   ?? page.canonicalUrl,
        robots:         dto.seo.robots         ?? page.robots,
      });
    }

    Object.assign(page, {
      title:     dto.title   ?? page.title,
      slug:      dto.slug    ?? page.slug,
      status:    dto.status  ?? page.status,
      content:   dto.content ?? page.content,
      updatedBy: userId,
    });

    await this.pageRepo.save(page);
    return this.toResponse(page);
  }

  // ── Generate from template ────────────────────────────────────────────────

  async generateFromTemplate(projectId: string, dto: GeneratePageDto, userId: string): Promise<PageResponseDto> {
    const template = await this.templatesService.findById(dto.templateId);
    const content  = await this.contentService.getContentData();

    const blocks = this.templatesService.buildBlocks(template, {
      content: content as unknown as Record<string, unknown>,
      city:         dto.city,
      power:        dto.power,
      audience:     dto.audience,
      customFields: dto.customFields,
    });

    const seo = this.seoService.generate({
      title:    dto.title,
      city:     dto.city,
      power:    dto.power,
      audience: dto.audience,
    });

    const slug = await this.resolveSlug(projectId, seo.slug);

    const page = this.pageRepo.create({
      projectId,
      templateId:     dto.templateId,
      title:          dto.title,
      slug,
      urlPath:        `/${slug}`,
      status:         PageStatus.GENERATED,
      content:        { blocks },
      previewHtml:    this.buildPreviewHtml(dto.title, blocks, seo),
      seoTitle:       seo.seoTitle,
      seoDescription: seo.seoDescription,
      seoKeywords:    seo.seoKeywords,
      ogTitle:        seo.ogTitle,
      ogDescription:  seo.ogDescription,
      createdBy:      userId,
      updatedBy:      userId,
    });

    await this.pageRepo.save(page);
    this.logger.log(`Page generated: "${page.title}" from template ${dto.templateId}`);
    return this.toResponse(page);
  }

  // ── Regenerate SEO ────────────────────────────────────────────────────────

  async regenerateSeo(projectId: string, pageId: string, userId: string): Promise<PageResponseDto> {
    const page = await this.findOne(projectId, pageId);
    const seo  = this.seoService.generate({ title: page.title });

    Object.assign(page, {
      seoTitle:       seo.seoTitle,
      seoDescription: seo.seoDescription,
      seoKeywords:    seo.seoKeywords,
      ogTitle:        seo.ogTitle,
      ogDescription:  seo.ogDescription,
      updatedBy:      userId,
    });

    await this.pageRepo.save(page);
    return this.toResponse(page);
  }

  // ── Archive / Delete ──────────────────────────────────────────────────────

  async archive(projectId: string, pageId: string): Promise<PageResponseDto> {
    const page      = await this.findOne(projectId, pageId);
    page.status     = PageStatus.ARCHIVED;
    page.archivedAt = new Date();
    await this.pageRepo.save(page);
    return this.toResponse(page);
  }

  async remove(projectId: string, pageId: string): Promise<{ message: string }> {
    await this.findOne(projectId, pageId);
    await this.pageRepo.softDelete(pageId);
    return { message: 'Сторінку видалено' };
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  async getPreview(projectId: string, pageId: string): Promise<{ html: string }> {
    const page = await this.findOne(projectId, pageId);
    if (!page.previewHtml) {
      return { html: this.buildPreviewHtml(page.title, page.content.blocks ?? [], {
        seoTitle: page.seoTitle ?? '',
        seoDescription: page.seoDescription ?? '',
        h1: page.seoTitle ?? page.title,
      } as any) };
    }
    return { html: page.previewHtml };
  }

  // ── Sprint 2: Export для Tilda ────────────────────────────────────────────

  async exportForTilda(projectId: string, pageId: string): Promise<TildaExportDto> {
    const page = await this.findOne(projectId, pageId);

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
      estimatedMinutes: blocks.length * 2,
    };
  }

  // ── Sprint 2: Масова генерація ────────────────────────────────────────────

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

  private async findOne(projectId: string, pageId: string): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id: pageId, projectId } });
    if (!page) throw new NotFoundException('Сторінку не знайдено');
    return page;
  }

  private async resolveSlug(projectId: string, slug: string, excludeId?: string): Promise<string> {
    const existing = await this.pageRepo.find({ where: { projectId }, select: ['slug', 'id'] });
    const taken = existing.filter(p => p.id !== excludeId).map(p => p.slug);
    return this.seoService.makeUniqueSlug(slug, taken);
  }

  private buildPreviewHtml(title: string, blocks: any[], seo: any): string {
    const blockHtml = blocks.map(b => {
      const d = b.data ?? {};
      switch (b.type) {
        case 'hero':
          return `<section class="hero"><h1>${d.title ?? title}</h1><p>${d.subtitle ?? ''}</p><a class="btn">${d.cta ?? 'Дізнатись більше'}</a></section>`;
        case 'pain':
          const items = (d.items ?? []).map((i: any) =>
            `<li><span class="bad">${i.problem}</span><span class="good">${i.solution}</span></li>`).join('');
          return `<section class="pain"><h2>${d.title ?? 'Наші рішення'}</h2><ul>${items}</ul></section>`;
        case 'steps':
          const steps = (d.items ?? []).map((s: any, idx: number) =>
            `<div class="step"><span>${idx + 1}</span><strong>${s.title}</strong><p>${s.description ?? ''}</p></div>`).join('');
          return `<section class="steps"><h2>${d.title ?? 'Як це працює'}</h2>${steps}</section>`;
        case 'numbers':
          const nums = (d.items ?? []).map((n: any) =>
            `<div class="num"><strong>${n.value}</strong><span>${n.label}</span></div>`).join('');
          return `<section class="numbers">${nums}</section>`;
        case 'guarantees':
          const guar = (d.items ?? []).map((g: string) => `<li>${g}</li>`).join('');
          return `<section class="guarantees"><h2>Гарантії</h2><ul>${guar}</ul></section>`;
        case 'cta':
          return `<section class="cta"><h2>${d.title ?? ''}</h2><p>${d.text ?? ''}</p><a class="btn">${d.button ?? 'Залишити заявку'}</a></section>`;
        default:
          return `<section class="block-${b.type}"></section>`;
      }
    }).join('\n');

    return `<!DOCTYPE html><html lang="uk"><head>
<meta charset="UTF-8"><title>${seo.seoTitle ?? title}</title>
<meta name="description" content="${seo.seoDescription ?? ''}">
<style>body{font-family:sans-serif;margin:0;color:#222}.hero{background:#f5a623;padding:60px 20px;text-align:center}.hero h1{font-size:2.2rem;margin-bottom:16px}.btn{display:inline-block;background:#000;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px}section{padding:48px 20px;max-width:900px;margin:0 auto}.pain ul,.guarantees ul{list-style:none;padding:0}.pain li{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #eee}.bad{color:#e44}.good{color:#2a2;margin-left:8px}.steps{display:flex;gap:20px;flex-wrap:wrap}.step{flex:1;min-width:200px;padding:20px;background:#f9f9f9;border-radius:8px}.numbers{display:flex;gap:20px;flex-wrap:wrap;background:#222;color:#fff;padding:40px;justify-content:center}.num{text-align:center;padding:0 20px}.num strong{display:block;font-size:2rem;color:#f5a623}.cta{background:#f9f9f9;text-align:center;border-radius:12px}</style>
</head><body>${blockHtml}</body></html>`;
  }

  private buildTildaInstruction(type: string, data: any): string {
    switch (type) {
      case 'hero': return `1. Додайте блок ${type}\n2. Заголовок: "${data.title ?? ''}"\n3. Підзаголовок: "${data.subtitle ?? ''}"\n4. Кнопка: "${data.cta ?? ''}"`;
      case 'pain': return `1. Додайте таблицю 2 колонки\n2. Ліва — "Проблема", права — "Рішення"\n3. Заповніть ${(data.items ?? []).length} рядків`;
      case 'cta':  return `1. Додайте CTA блок з формою\n2. Заголовок: "${data.title ?? ''}"\n3. Текст: "${data.text ?? ''}"\n4. Кнопка: "${data.button ?? ''}"`;
      default:     return `Заповніть блок "${type}" відповідно до полів нижче`;
    }
  }

  private flattenBlockData(data: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    const flatten = (obj: any, prefix = '') => {
      for (const [k, v] of Object.entries(obj ?? {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string' || typeof v === 'number') result[key] = String(v);
        else if (Array.isArray(v)) v.forEach((item, i) => {
          if (typeof item === 'string') result[`${key}[${i}]`] = item;
          else if (typeof item === 'object') flatten(item, `${key}[${i}]`);
        });
        else if (typeof v === 'object') flatten(v, key);
      }
    };
    flatten(data);
    return result;
  }

  toResponse(p: Page): PageResponseDto {
    return {
      id:             p.id,
      projectId:      p.projectId,
      title:          p.title,
      slug:           p.slug,
      urlPath:        p.urlPath,
      status:         p.status,
      templateId:     p.templateId,
      content:        p.content as unknown as Record<string, unknown>,
      previewHtml:    p.previewHtml,
      seoTitle:       p.seoTitle,
      seoDescription: p.seoDescription,
      seoKeywords:    p.seoKeywords,
      ogTitle:        p.ogTitle,
      ogDescription:  p.ogDescription,
      ogImageUrl:     p.ogImageUrl,
      canonicalUrl:   p.canonicalUrl,
      robots:         p.robots,
      sortOrder:      p.sortOrder,
      publishedAt:    p.publishedAt,
      createdAt:      p.createdAt,
      updatedAt:      p.updatedAt,
    };
  }
}
