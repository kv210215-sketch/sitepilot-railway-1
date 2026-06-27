import {
  Injectable, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Page, PageStatus } from '../pages/page.entity';
import { Project } from '../projects/project.entity';
import { PublicPageDto } from './public-page.dto';
import { PublicSitemapEntryDto } from './public-sitemap-entry.dto';
import { normalizePublicPagePath } from './public-path.util';

@Injectable()
export class PublicPagesService {
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
    const projectSlug = this.config.get<string>('public.defaultProjectSlug') ?? 'solomiya-energy';
    const defaultProject = await this.projectRepo.findOne({
      where: {
        slug: projectSlug,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (defaultProject) {
      const defaultPage = await this.findPublishedPage(defaultProject.id, path);
      if (defaultPage) {
        return this.toDto(defaultPage, defaultProject);
      }
    }

    // 2) Fall back to any active project's published page matching this path.
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

    const projectSlug = this.config.get<string>('public.defaultProjectSlug') ?? 'solomiya-energy';
    const project = await this.projectRepo.findOne({
      where: {
        slug: projectSlug,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

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
    if (path === '/') {
      return this.pageRepo.findOne({
        where: {
          status: PageStatus.PUBLISHED,
          isHomepage: true,
          deletedAt: IsNull(),
        },
        order: { publishedAt: 'DESC' },
      });
    }

    return this.pageRepo.findOne({
      where: {
        path,
        status: PageStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
      order: { publishedAt: 'DESC' },
    });
  }

  private toDto(page: Page, project: Project): PublicPageDto {
    const dto = new PublicPageDto();
    dto.projectId = project.id;
    dto.pageId = page.id;
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

  private resolveCanonicalUrl(page: Page, project: Project): string {
    if (page.canonicalUrl) {
      return page.canonicalUrl;
    }

    const domain = (project.domain ?? '').replace(/\/$/, '');
    const base = domain.startsWith('http') ? domain : `https://${domain || 'localhost'}`;
    const pagePath = page.path ?? '/';

    return pagePath === '/' ? `${base}/` : `${base}${pagePath}`;
  }
}
