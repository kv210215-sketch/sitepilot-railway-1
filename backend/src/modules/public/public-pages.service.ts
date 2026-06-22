import {
  Injectable, Logger, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';

import { Page, PageStatus } from '../pages/page.entity';
import { Project } from '../projects/project.entity';
import { PublicPageDto } from './public-page.dto';
import { PublicSitemapEntryDto } from './public-sitemap-entry.dto';
import { normalizePublicPagePath } from './public-path.util';

@Injectable()
export class PublicPagesService {
  private readonly logger = new Logger(PublicPagesService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly config: ConfigService,
  ) {}

  assertPublicApiEnabled(): void {
    const enabled = this.config.get<boolean>('public.enabled');
    if (!enabled) {
      throw new ServiceUnavailableException('Public read API is disabled');
    }
  }

  async getPublishedPageByPath(rawPath: string | string[] | undefined): Promise<PublicPageDto> {
    this.assertPublicApiEnabled();

    const path = normalizePublicPagePath(rawPath);

    // 1) Configured default project first — preserves the existing marketing site (incl. root `/`).
    const defaultProject = await this.resolveDefaultProject();

    if (defaultProject) {
      const defaultPage = await this.findPublishedPage(defaultProject.id, path);
      if (defaultPage) {
        return this.toDto(defaultPage, defaultProject);
      }
    }

    // 2) Fall back to any *active, non-deleted* project's published page matching this path.
    const page = await this.findPublishedPageAnyProject(path);
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const project = await this.projectRepo.findOne({
      where: { id: page.projectId, deletedAt: IsNull(), isActive: true },
    });
    if (!project) {
      throw new NotFoundException('Page not found');
    }

    return this.toDto(page, project);
  }

  async listPublishedSitemapEntries(): Promise<PublicSitemapEntryDto[]> {
    this.assertPublicApiEnabled();

    const project = await this.resolveDefaultProject();

    if (!project) {
      return [];
    }

    const pages = await this.pageRepo.find({
      where: {
        projectId: project.id,
        status: PageStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
      order: { sortOrder: 'ASC', updatedAt: 'DESC' },
      select: ['path', 'robotsIndex', 'updatedAt', 'publishedAt', 'isHomepage'],
    });

    return pages
      .filter((p) => p.path)
      .map((p) => {
        const entry = new PublicSitemapEntryDto();
        entry.path = p.path ?? '/';
        entry.robotsIndex = p.robotsIndex;
        entry.updatedAt = p.updatedAt.toISOString();
        entry.publishedAt = p.publishedAt?.toISOString() ?? null;
        entry.isHomepage = p.isHomepage;
        return entry;
      });
  }

  /**
   * Resolves the configured default public project.
   *
   * Project slugs are unique only within an organization, so selecting by slug
   * alone can match an arbitrary tenant when two orgs share a slug. We therefore
   * prefer a globally-unique id, then a slug scoped to a configured org, and only
   * fall back to a bare slug for single-tenant installs — logging a warning (and
   * choosing deterministically) if that bare slug is ambiguous.
   */
  private async resolveDefaultProject(): Promise<Project | null> {
    const projectId = this.config.get<string>('public.defaultProjectId');
    if (projectId) {
      return this.projectRepo.findOne({
        where: { id: projectId, deletedAt: IsNull(), isActive: true },
      });
    }

    const slug = this.config.get<string>('public.defaultProjectSlug') ?? 'solomiya-energy';
    const organizationId = this.config.get<string>('public.defaultOrganizationId') ?? null;

    const where: FindOptionsWhere<Project> = {
      slug,
      deletedAt: IsNull(),
      isActive: true,
    };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const matches = await this.projectRepo.find({
      where,
      // Deterministic tie-break so the same project is served on every request.
      order: { createdAt: 'ASC' },
      take: 2,
    });

    if (matches.length > 1) {
      this.logger.warn(
        `Public default project slug "${slug}" matched multiple active projects across `
        + 'organizations. Set PUBLIC_DEFAULT_PROJECT_ID or PUBLIC_DEFAULT_ORG_ID to '
        + 'disambiguate. Serving the oldest match.',
      );
    }

    return matches[0] ?? null;
  }

  private async findPublishedPage(projectId: string, path: string): Promise<Page | null> {
    if (path === '/') {
      return this.pageRepo.findOne({
        where: {
          projectId,
          status: PageStatus.PUBLISHED,
          isHomepage: true,
          deletedAt: IsNull(),
        },
      });
    }

    return this.pageRepo.findOne({
      where: {
        projectId,
        path,
        status: PageStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
    });
  }

  private async findPublishedPageAnyProject(path: string): Promise<Page | null> {
    // Only consider pages whose owning project is active and not soft-deleted, so
    // an inactive/deleted project's newer page cannot shadow valid content on an
    // active project (which previously surfaced as a 404).
    const projectScope: FindOptionsWhere<Project> = {
      isActive: true,
      deletedAt: IsNull(),
    };

    if (path === '/') {
      return this.pageRepo.findOne({
        where: {
          status: PageStatus.PUBLISHED,
          isHomepage: true,
          deletedAt: IsNull(),
          project: projectScope,
        },
        order: { publishedAt: 'DESC' },
      });
    }

    return this.pageRepo.findOne({
      where: {
        path,
        status: PageStatus.PUBLISHED,
        deletedAt: IsNull(),
        project: projectScope,
      },
      order: { publishedAt: 'DESC' },
    });
  }

  private toDto(page: Page, project: Project): PublicPageDto {
    const dto = new PublicPageDto();
    dto.path = page.path ?? '/';
    dto.title = page.metaTitle ?? page.seoTitle ?? page.title;
    dto.metaDescription = page.metaDescription ?? page.seoDescription ?? null;
    dto.canonicalUrl = this.resolveCanonicalUrl(page, project);
    dto.robotsIndex = page.robotsIndex;
    dto.robotsFollow = page.robotsFollow;
    dto.seoKeywords = page.seoKeywords ?? null;
    dto.ogTitle = page.ogTitle ?? null;
    dto.ogDescription = page.ogDescription ?? null;
    dto.ogImageUrl = page.ogImageUrl ?? null;
    dto.structuredData =
      page.structuredData && Object.keys(page.structuredData).length > 0
        ? page.structuredData
        : null;
    dto.blocks = page.content?.blocks ?? [];
    dto.updatedAt = page.updatedAt.toISOString();
    dto.publishedAt = page.publishedAt?.toISOString() ?? null;
    dto.isHomepage = page.isHomepage;
    return dto;
  }

  /**
   * Resolves the canonical URL for a page.
   *
   * Returns null when there is no explicit page canonical, no project domain, and
   * no configured marketing origin — rather than inventing `https://localhost`,
   * which would emit localhost canonical/OG URLs in staging/production. When the
   * canonical is null, marketing-web derives it from the request/marketing origin.
   */
  private resolveCanonicalUrl(page: Page, project: Project): string | null {
    if (page.canonicalUrl) {
      return page.canonicalUrl;
    }

    const base = this.resolveCanonicalBase(project);
    if (!base) {
      return null;
    }

    const pagePath = page.path ?? '/';
    return pagePath === '/' ? `${base}/` : `${base}${pagePath}`;
  }

  /** Origin (no trailing slash) for canonical URLs: project domain, else configured marketing origin. */
  private resolveCanonicalBase(project: Project): string | null {
    const domain = (project.domain ?? '').trim().replace(/\/$/, '');
    if (domain) {
      return domain.startsWith('http') ? domain : `https://${domain}`;
    }

    const marketingOrigin = this.config.get<string>('public.marketingOrigin');
    if (marketingOrigin) {
      return marketingOrigin.replace(/\/$/, '');
    }

    return null;
  }
}
