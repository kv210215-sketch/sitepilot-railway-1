import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Page, PageStatus, PageContent, PageType } from './page.entity';
import { Project } from '../projects/project.entity';
import { OrganizationMember, OrgRole } from '../organizations/entities/organization-member.entity';
import { SystemRole } from '../users/user.entity';

import {
  CreatePageDto, UpdatePageDto, ListPagesQueryDto, GeneratePageDto,
  PageResponseDto, PaginatedPagesDto,
} from './pages.dto';
import { SeoService } from '../seo/seo.service';
import { TemplatesService } from '../templates/templates.service';
import { ContentService } from '../content/content.service';
import { PreviewRenderer } from './preview.renderer';

// ── Sprint 2 interfaces (unchanged) ──────────────────────────────────────────

export interface TildaExportDto {
  pageTitle:   string;
  slug:        string;
  path:        string;
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
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
    private readonly seoService: SeoService,
    private readonly templatesService: TemplatesService,
    private readonly contentService: ContentService,
    private readonly renderer: PreviewRenderer,
  ) {}

  // ── List (standalone — across orgs) ──────────────────────────────────────────
  // Returns pages in all projects accessible to the user via org membership.

  async list(
    userId: string,
    systemRole: SystemRole,
    query: ListPagesQueryDto,
  ): Promise<PaginatedPagesDto> {
    const page  = query.page  ?? 1;
    const limit = Math.min(query.limit ?? 30, 100);
    const skip  = (page - 1) * limit;

    const qb = this.pageRepo.createQueryBuilder('pg')
      .innerJoin(Project, 'proj', 'proj.id = pg.project_id AND proj.deleted_at IS NULL')
      .where('pg.deleted_at IS NULL');

    if (systemRole !== SystemRole.SUPER_ADMIN) {
      qb.innerJoin(
        OrganizationMember,
        'om',
        'om.organization_id = proj.organization_id AND om.user_id = :userId AND om.is_active = true',
        { userId },
      ).andWhere('proj.organization_id IS NOT NULL');
    }

    this.applyPageFilters(qb, query);

    const [pages, total] = await qb
      .orderBy(this.pageOrderCol(query.orderBy), 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: pages.map(p => this.toResponseDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── List by project (nested route helper) ────────────────────────────────────
  // Guard has already verified membership. Service re-verifies for defense-in-depth.

  async listByProject(
    projectId: string,
    userId: string,
    systemRole: SystemRole,
    query: ListPagesQueryDto,
  ): Promise<PaginatedPagesDto> {
    await this.resolveProjectAccess(projectId, userId, systemRole);

    const page  = query.page  ?? 1;
    const limit = Math.min(query.limit ?? 30, 100);
    const skip  = (page - 1) * limit;

    const qb = this.pageRepo.createQueryBuilder('pg')
      .where('pg.project_id = :projectId', { projectId })
      .andWhere('pg.deleted_at IS NULL');

    this.applyPageFilters(qb, query);

    const [pages, total] = await qb
      .orderBy(this.pageOrderCol(query.orderBy), 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: pages.map(p => this.toResponseDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get one ───────────────────────────────────────────────────────────────────

  async getOne(
    pageId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<PageResponseDto> {
    const page = await this.loadPage(pageId);
    await this.resolveProjectAccess(page.projectId, userId, systemRole);
    return this.toResponseDto(page);
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  async create(
    dto: CreatePageDto,
    userId: string,
    systemRole: SystemRole,
  ): Promise<PageResponseDto> {
    await this.resolveProjectAccess(
      dto.projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    const slug = await this.resolveSlug(
      dto.projectId,
      dto.slug ?? this.seoService.generateSlug({ title: dto.title }),
    );

    const rawPath = dto.path ?? `/${slug}`;
    const path    = this.normalizePath(rawPath);
    await this.assertPathUnique(dto.projectId, path);

    // Homepage rule: auto-clear existing homepage on this project
    if (dto.isHomepage) {
      await this.clearHomepage(dto.projectId);
    }

    const seo = this.seoService.generate({ title: dto.title });

    const page = this.pageRepo.create({
      projectId:      dto.projectId,
      name:           dto.name      ?? null,
      title:          dto.title,
      slug,
      path,
      pageType:       dto.pageType  ?? PageType.PAGE,
      status:         PageStatus.DRAFT,
      isHomepage:     dto.isHomepage ?? false,
      templateId:     dto.templateId ?? null,
      parentId:       dto.parentId   ?? null,
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
    this.logger.log(`Page created: ${page.id} "${page.title}" in project ${dto.projectId}`);
    return this.toResponseDto(page);
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  async update(
    pageId: string,
    dto: UpdatePageDto,
    userId: string,
    systemRole: SystemRole,
  ): Promise<PageResponseDto> {
    const page = await this.loadPage(pageId);
    await this.resolveProjectAccess(
      page.projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    if (dto.slug !== undefined && dto.slug !== page.slug) {
      dto.slug = await this.resolveSlug(page.projectId, dto.slug, pageId);
    }

    if (dto.path !== undefined) {
      const normalized = this.normalizePath(dto.path);
      if (normalized !== page.path) {
        await this.assertPathUnique(page.projectId, normalized, pageId);
        dto.path = normalized;
      }
    }

    // Homepage rule: clear other homepages before setting this one
    if (dto.isHomepage === true && !page.isHomepage) {
      await this.clearHomepage(page.projectId, pageId);
    }

    // Apply scalar updates
    if (dto.name      !== undefined) page.name      = dto.name      ?? null;
    if (dto.title     !== undefined) page.title     = dto.title;
    if (dto.slug      !== undefined) page.slug      = dto.slug;
    if (dto.path      !== undefined) page.path      = dto.path ?? null;
    if (dto.pageType  !== undefined) page.pageType  = dto.pageType;
    if (dto.status    !== undefined) page.status    = dto.status;
    if (dto.isHomepage !== undefined) page.isHomepage = dto.isHomepage;
    if (dto.h1        !== undefined) page.h1        = dto.h1        ?? null;
    if (dto.body      !== undefined) page.body      = dto.body      ?? null;
    if (dto.content   !== undefined) page.content   = dto.content as unknown as PageContent;
    if (dto.sortOrder !== undefined) page.sortOrder = dto.sortOrder;
    page.updatedBy = userId;

    // Apply SEO sub-object
    if (dto.seo) {
      const s = dto.seo;
      if (s.metaTitle      !== undefined) page.metaTitle      = s.metaTitle      ?? null;
      if (s.metaDescription !== undefined) page.metaDescription = s.metaDescription ?? null;
      if (s.ogTitle        !== undefined) page.ogTitle        = s.ogTitle        ?? null;
      if (s.ogDescription  !== undefined) page.ogDescription  = s.ogDescription  ?? null;
      if (s.ogImageUrl     !== undefined) page.ogImageUrl     = s.ogImageUrl     ?? null;
      if (s.canonicalUrl   !== undefined) page.canonicalUrl   = s.canonicalUrl   ?? null;
      if (s.robotsIndex    !== undefined) page.robotsIndex    = s.robotsIndex;
      if (s.robotsFollow   !== undefined) page.robotsFollow   = s.robotsFollow;
      // Legacy Sprint 2 SEO fields
      if (s.seoTitle       !== undefined) page.seoTitle       = s.seoTitle       ?? null;
      if (s.seoDescription !== undefined) page.seoDescription = s.seoDescription ?? null;
      if (s.seoKeywords    !== undefined) page.seoKeywords    = s.seoKeywords    ?? null;
      if (s.robots         !== undefined) page.robots         = s.robots         ?? 'index, follow';
    }

    await this.pageRepo.save(page);
    return this.toResponseDto(page);
  }

  // ── Archive ───────────────────────────────────────────────────────────────────

  async archive(
    pageId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<PageResponseDto> {
    const page = await this.loadPage(pageId);
    await this.resolveProjectAccess(
      page.projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    page.status     = PageStatus.ARCHIVED;
    page.archivedAt = new Date();
    await this.pageRepo.save(page);
    return this.toResponseDto(page);
  }

  // ── Soft delete ───────────────────────────────────────────────────────────────

  async remove(
    pageId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<{ message: string }> {
    const page = await this.loadPage(pageId);
    await this.resolveProjectAccess(
      page.projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );
    await this.pageRepo.softDelete(pageId);
    return { message: 'Сторінку видалено' };
  }

  // ── Sprint 2: Generate from template ─────────────────────────────────────────

  async generateFromTemplate(
    projectId: string,
    dto: GeneratePageDto,
    userId: string,
    systemRole: SystemRole,
  ): Promise<PageResponseDto> {
    await this.resolveProjectAccess(
      projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    const template = await this.templatesService.findById(dto.templateId);
    const content  = await this.contentService.getContentData();

    const blocks = this.templatesService.buildBlocks(template, {
      content:      content as unknown as Record<string, unknown>,
      city:         dto.city,
      power:        dto.power,
      audience:     dto.audience,
      customFields: dto.customFields,
    });

    const seo  = this.seoService.generate({
      title: dto.title, city: dto.city, power: dto.power, audience: dto.audience,
    });
    const slug = await this.resolveSlug(projectId, seo.slug);
    const path = this.normalizePath(`/${slug}`);
    await this.assertPathUnique(projectId, path);

    const page = this.pageRepo.create({
      projectId,
      templateId:     dto.templateId,
      title:          dto.title,
      slug,
      path,
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
    return this.toResponseDto(page);
  }

  // ── Sprint 2: Regenerate SEO ──────────────────────────────────────────────────

  async regenerateSeo(
    projectId: string,
    pageId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<PageResponseDto> {
    const page = await this.findLegacy(projectId, pageId);
    await this.resolveProjectAccess(
      projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

    const seo = this.seoService.generate({ title: page.title });
    Object.assign(page, {
      seoTitle:       seo.seoTitle,
      seoDescription: seo.seoDescription,
      seoKeywords:    seo.seoKeywords,
      ogTitle:        seo.ogTitle,
      ogDescription:  seo.ogDescription,
      updatedBy:      userId,
    });

    await this.pageRepo.save(page);
    return this.toResponseDto(page);
  }

  // ── Sprint 2: Preview ─────────────────────────────────────────────────────────

  async getPreview(
    projectId: string,
    pageId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<{ html: string }> {
    const page = await this.findLegacy(projectId, pageId);
    await this.resolveProjectAccess(projectId, userId, systemRole);

    if (!page.previewHtml) {
      return {
        html: this.buildPreviewHtml(page.title, page.content?.blocks ?? [], {
          seoTitle:       page.seoTitle ?? '',
          seoDescription: page.seoDescription ?? '',
          h1:             page.seoTitle ?? page.title,
        } as any),
      };
    }
    return { html: page.previewHtml };
  }

  // ── Sprint 2: Export for Tilda ────────────────────────────────────────────────

  async exportForTilda(
    projectId: string,
    pageId: string,
    userId: string,
    systemRole: SystemRole,
  ): Promise<TildaExportDto> {
    const page = await this.findLegacy(projectId, pageId);
    await this.resolveProjectAccess(projectId, userId, systemRole);

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
      path:      page.path ?? `/${page.slug}`,
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

  // ── Sprint 2: Bulk generate ───────────────────────────────────────────────────

  async bulkGenerate(
    projectId: string,
    dto: BulkGenerateDto,
    userId: string,
    systemRole: SystemRole,
  ): Promise<{ created: number; pages: Array<{ city: string; slug: string; id: string }> }> {
    await this.resolveProjectAccess(
      projectId, userId, systemRole, [OrgRole.ADMIN, OrgRole.OWNER],
    );

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
      const path = this.normalizePath(`/${slug}`);
      // Skip path conflicts silently during bulk operations
      const pathExists = await this.pageRepo.findOne({ where: { projectId, path } });
      if (pathExists) continue;

      const page = this.pageRepo.create({
        projectId,
        templateId:     dto.templateId,
        title,
        slug,
        path,
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
      this.logger.log(`Bulk generated: "${title}" → ${path}`);
    }

    return { created: results.length, pages: results };
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  /**
   * Resolve org membership for a project. Throws 403/404 if access denied.
   * Returns the project. SUPER_ADMIN bypasses membership check.
   */
  async resolveProjectAccess(
    projectId: string,
    userId: string,
    systemRole: SystemRole,
    requiredRoles?: OrgRole[],
  ): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Проєкт не знайдено');

    if (systemRole === SystemRole.SUPER_ADMIN) return project;

    const { organizationId } = project;
    if (!organizationId) {
      throw new ForbiddenException('Проєкт не прив\'язаний до організації');
    }

    const member = await this.memberRepo.findOne({
      where: { organizationId, userId, isActive: true },
    });
    if (!member) throw new ForbiddenException('Немає доступу до цього проєкту');

    if (requiredRoles?.length && member.role !== OrgRole.OWNER && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException(`Потрібна роль: ${requiredRoles.join(' або ')}`);
    }

    return project;
  }

  private async loadPage(pageId: string): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Сторінку не знайдено');
    return page;
  }

  /** Legacy helper: load page by (projectId, pageId) for Sprint 2 methods */
  private async findLegacy(projectId: string, pageId: string): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id: pageId, projectId } });
    if (!page) throw new NotFoundException('Сторінку не знайдено');
    return page;
  }

  private async resolveSlug(
    projectId: string,
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    const existing = await this.pageRepo.find({ where: { projectId }, select: ['slug', 'id'] });
    const taken    = existing.filter(p => p.id !== excludeId).map(p => p.slug);
    return this.seoService.makeUniqueSlug(slug, taken);
  }

  private async assertPathUnique(
    projectId: string,
    path: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.pageRepo.createQueryBuilder('p')
      .where('p.project_id = :projectId', { projectId })
      .andWhere('p.path = :path', { path })
      .andWhere('p.deleted_at IS NULL');

    if (excludeId) {
      qb.andWhere('p.id != :excludeId', { excludeId });
    }

    const exists = await qb.getOne();
    if (exists) {
      throw new ConflictException(`Path "${path}" вже використовується в цьому проєкті`);
    }
  }

  private normalizePath(input: string): string {
    // Ensure starts with /, collapse double slashes, trim trailing slash (except root)
    let p = input.startsWith('/') ? input : `/${input}`;
    p = p.replace(/\/+/g, '/');
    if (p.length > 1) p = p.replace(/\/$/, '');
    return p.toLowerCase();
  }

  private async clearHomepage(projectId: string, excludeId?: string): Promise<void> {
    const qb = this.pageRepo.createQueryBuilder()
      .update(Page)
      .set({ isHomepage: false })
      .where('project_id = :projectId', { projectId })
      .andWhere('is_homepage = true');

    if (excludeId) {
      qb.andWhere('id != :excludeId', { excludeId });
    }

    await qb.execute();
  }

  private applyPageFilters(qb: any, query: ListPagesQueryDto): void {
    if (query.projectId) {
      qb.andWhere('pg.project_id = :projectId', { projectId: query.projectId });
    }
    if (query.pageType) {
      qb.andWhere('pg.page_type = :pageType', { pageType: query.pageType });
    }
    if (query.status) {
      qb.andWhere('pg.status = :status', { status: query.status });
    }
    if (query.isHomepage !== undefined) {
      qb.andWhere('pg.is_homepage = :isHomepage', { isHomepage: query.isHomepage });
    }
    if (query.search) {
      qb.andWhere(
        '(pg.name ILIKE :q OR pg.title ILIKE :q OR pg.slug ILIKE :q OR pg.path ILIKE :q)',
        { q: `%${query.search}%` },
      );
    }
  }

  private pageOrderCol(orderBy?: string): string {
    const map: Record<string, string> = {
      name:      'pg.name',
      title:     'pg.title',
      createdAt: 'pg.created_at',
      updatedAt: 'pg.updated_at',
      sortOrder: 'pg.sort_order',
    };
    return map[orderBy ?? 'sortOrder'] ?? 'pg.sort_order';
  }

  toResponseDto(p: Page): PageResponseDto {
    return {
      id:              p.id,
      projectId:       p.projectId,
      name:            p.name,
      title:           p.title,
      slug:            p.slug,
      path:            p.path,
      pageType:        p.pageType,
      status:          p.status,
      isHomepage:      p.isHomepage,
      h1:              p.h1,
      body:            p.body,
      content:         p.content as unknown as Record<string, unknown>,
      metaTitle:       p.metaTitle,
      metaDescription: p.metaDescription,
      seoTitle:        p.seoTitle,
      seoDescription:  p.seoDescription,
      ogTitle:         p.ogTitle,
      ogDescription:   p.ogDescription,
      ogImageUrl:      p.ogImageUrl,
      canonicalUrl:    p.canonicalUrl,
      robotsIndex:     p.robotsIndex,
      robotsFollow:    p.robotsFollow,
      sortOrder:       p.sortOrder,
      publishedAt:     p.publishedAt,
      createdAt:       p.createdAt,
      updatedAt:       p.updatedAt,
    };
  }

  // ── Sprint 2: private utils (unchanged) ──────────────────────────────────────

  private buildPreviewHtml(title: string, blocks: any[], seo: any): string {
    const blockHtml = blocks.map(b => {
      const d = b.data ?? {};
      switch (b.type) {
        case 'hero':
          return `<section class="hero"><h1>${d.title ?? title}</h1><p>${d.subtitle ?? ''}</p><a class="btn">${d.cta ?? 'Дізнатись більше'}</a></section>`;
        case 'pain': {
          const items = (d.items ?? []).map((i: any) =>
            `<li><span class="bad">${i.problem}</span><span class="good">${i.solution}</span></li>`).join('');
          return `<section class="pain"><h2>${d.title ?? 'Наші рішення'}</h2><ul>${items}</ul></section>`;
        }
        case 'steps': {
          const steps = (d.items ?? []).map((s: any, idx: number) =>
            `<div class="step"><span>${idx + 1}</span><strong>${s.title}</strong><p>${s.description ?? ''}</p></div>`).join('');
          return `<section class="steps"><h2>${d.title ?? 'Як це працює'}</h2>${steps}</section>`;
        }
        case 'numbers': {
          const nums = (d.items ?? []).map((n: any) =>
            `<div class="num"><strong>${n.value}</strong><span>${n.label}</span></div>`).join('');
          return `<section class="numbers">${nums}</section>`;
        }
        case 'guarantees': {
          const guar = (d.items ?? []).map((g: string) => `<li>${g}</li>`).join('');
          return `<section class="guarantees"><h2>Гарантії</h2><ul>${guar}</ul></section>`;
        }
        case 'cta':
          return `<section class="cta"><h2>${d.title ?? ''}</h2><p>${d.text ?? ''}</p><a class="btn">${d.button ?? 'Залишити заявку'}</a></section>`;
        default:
          return `<section class="block-${b.type}"></section>`;
      }
    }).join('\n');

    return `<!DOCTYPE html><html lang="uk"><head>
<meta charset="UTF-8"><title>${seo.seoTitle ?? title}</title>
<meta name="description" content="${seo.seoDescription ?? ''}">
<style>body{font-family:sans-serif;margin:0;color:#222}.hero{background:#f5a623;padding:60px 20px;text-align:center}.hero h1{font-size:2.2rem;margin-bottom:16px}.btn{display:inline-block;background:#000;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px}section{padding:48px 20px;max-width:900px;margin:0 auto}</style>
</head><body>${blockHtml}</body></html>`;
  }

  private buildTildaInstruction(type: string, data: any): string {
    switch (type) {
      case 'hero': return `1. Заголовок: "${data.title ?? ''}"\n2. Підзаголовок: "${data.subtitle ?? ''}"\n3. Кнопка: "${data.cta ?? ''}"`;
      case 'cta':  return `1. Заголовок: "${data.title ?? ''}"\n2. Текст: "${data.text ?? ''}"\n3. Кнопка: "${data.button ?? ''}"`;
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
}
