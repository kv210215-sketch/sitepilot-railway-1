import { Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FindOperator } from 'typeorm';

import { Page, PageStatus } from '../pages/page.entity';
import { Project } from '../projects/project.entity';
import { PublicPagesService } from './public-pages.service';

// ── In-memory repository fakes ──────────────────────────────────────────────
// Honour the actual FindOptions shapes the service builds (IsNull(), nested
// `project` relation filters, ordering, take) so the tests exercise real query
// behaviour rather than asserting on mock call arguments.

type AnyRecord = Record<string, any>;

function toComparable(value: unknown): number | string {
  if (value instanceof Date) return value.getTime();
  if (value === null || value === undefined) return -Infinity;
  return value as number | string;
}

function matchWhere(
  entity: AnyRecord,
  where: AnyRecord,
  resolveProject: (projectId: string) => Project | null,
): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (condition instanceof FindOperator) {
      // Only IsNull() is used by the service.
      return entity[key] === null || entity[key] === undefined;
    }
    if (key === 'project') {
      const project = resolveProject(entity.projectId);
      if (!project) return false;
      return matchWhere(project as unknown as AnyRecord, condition, resolveProject);
    }
    return entity[key] === condition;
  });
}

function applyOrder<T extends AnyRecord>(items: T[], order?: AnyRecord): T[] {
  if (!order) return items;
  const keys = Object.entries(order);
  return [...items].sort((a, b) => {
    for (const [key, dir] of keys) {
      const av = toComparable(a[key]);
      const bv = toComparable(b[key]);
      if (av < bv) return dir === 'ASC' ? -1 : 1;
      if (av > bv) return dir === 'ASC' ? 1 : -1;
    }
    return 0;
  });
}

function makeRepos(projects: Project[], pages: Page[]) {
  const resolveProject = (projectId: string): Project | null =>
    projects.find((p) => p.id === projectId) ?? null;

  const projectRepo = {
    findOne: jest.fn(async ({ where }: AnyRecord) =>
      projects.find((p) => matchWhere(p as unknown as AnyRecord, where, resolveProject)) ?? null),
    find: jest.fn(async ({ where, order, take }: AnyRecord) => {
      let rows = projects.filter((p) => matchWhere(p as unknown as AnyRecord, where, resolveProject));
      rows = applyOrder(rows, order);
      return take ? rows.slice(0, take) : rows;
    }),
  };

  const pageRepo = {
    findOne: jest.fn(async ({ where, order }: AnyRecord) => {
      const rows = applyOrder(
        pages.filter((p) => matchWhere(p as unknown as AnyRecord, where, resolveProject)),
        order,
      );
      return rows[0] ?? null;
    }),
    find: jest.fn(async ({ where, order }: AnyRecord) =>
      applyOrder(
        pages.filter((p) => matchWhere(p as unknown as AnyRecord, where, resolveProject)),
        order,
      )),
  };

  return { projectRepo, pageRepo };
}

// ── Config fake ─────────────────────────────────────────────────────────────

function makeConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const settings: Record<string, unknown> = {
    'public.enabled': true,
    'public.defaultProjectId': null,
    'public.defaultOrganizationId': null,
    'public.defaultProjectSlug': 'solomiya-energy',
    'public.marketingOrigin': null,
    ...overrides,
  };
  return { get: (key: string) => settings[key] } as unknown as ConfigService;
}

// ── Entity factories ────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-id',
    slug: 'some-slug',
    organizationId: 'org-1',
    isActive: true,
    deletedAt: null,
    domain: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as unknown as Project;
}

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-id',
    projectId: 'project-id',
    path: '/',
    status: PageStatus.PUBLISHED,
    isHomepage: false,
    deletedAt: null,
    publishedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    sortOrder: 0,
    robotsIndex: true,
    robotsFollow: true,
    content: { blocks: [] },
    canonicalUrl: null,
    metaTitle: null,
    seoTitle: null,
    title: 'Default Title',
    metaDescription: null,
    seoDescription: null,
    seoKeywords: null,
    ogTitle: null,
    ogDescription: null,
    ogImageUrl: null,
    structuredData: {},
    ...overrides,
  } as unknown as Page;
}

function makeService(projects: Project[], pages: Page[], config: ConfigService) {
  const { projectRepo, pageRepo } = makeRepos(projects, pages);
  const service = new PublicPagesService(pageRepo as any, projectRepo as any, config);
  return { service, projectRepo, pageRepo };
}

describe('PublicPagesService', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assertPublicApiEnabled', () => {
    it('throws when the public API is disabled', async () => {
      const { service } = makeService([], [], makeConfig({ 'public.enabled': false }));
      await expect(service.getPublishedPageByPath('/')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('default project resolution with same slug across two orgs', () => {
    const orgAProject = makeProject({
      id: 'proj-a',
      slug: 'shared-slug',
      organizationId: 'org-a',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    });
    const orgBProject = makeProject({
      id: 'proj-b',
      slug: 'shared-slug',
      organizationId: 'org-b',
      createdAt: new Date('2024-02-01T00:00:00Z'),
    });
    const orgAHome = makePage({
      id: 'home-a',
      projectId: 'proj-a',
      isHomepage: true,
      title: 'Org A Home',
    });
    const orgBHome = makePage({
      id: 'home-b',
      projectId: 'proj-b',
      isHomepage: true,
      title: 'Org B Home',
    });

    const projects = [orgAProject, orgBProject];
    const pages = [orgAHome, orgBHome];

    it('does not pick an arbitrary tenant: serves deterministically (oldest) and warns when slug is ambiguous', async () => {
      const { service } = makeService(
        projects,
        pages,
        makeConfig({ 'public.defaultProjectSlug': 'shared-slug' }),
      );

      const dto = await service.getPublishedPageByPath('/');

      // Oldest createdAt wins deterministically — not whichever the DB returned first.
      expect(dto.title).toBe('Org A Home');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('selects the correct tenant when scoped by organization id', async () => {
      const { service } = makeService(
        projects,
        pages,
        makeConfig({
          'public.defaultProjectSlug': 'shared-slug',
          'public.defaultOrganizationId': 'org-b',
        }),
      );

      const dto = await service.getPublishedPageByPath('/');

      expect(dto.title).toBe('Org B Home');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('selects by globally-unique project id when configured', async () => {
      const { service } = makeService(
        projects,
        pages,
        makeConfig({ 'public.defaultProjectId': 'proj-b' }),
      );

      const dto = await service.getPublishedPageByPath('/');

      expect(dto.title).toBe('Org B Home');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('disambiguates sitemap entries by the same scoped default project', async () => {
      const orgAEntry = makePage({
        id: 'page-a-svc',
        projectId: 'proj-a',
        path: '/a-only',
      });
      const orgBEntry = makePage({
        id: 'page-b-svc',
        projectId: 'proj-b',
        path: '/b-only',
      });
      const { service } = makeService(
        [orgAProject, orgBProject],
        [orgAEntry, orgBEntry],
        makeConfig({
          'public.defaultProjectSlug': 'shared-slug',
          'public.defaultOrganizationId': 'org-b',
        }),
      );

      const entries = await service.listPublishedSitemapEntries();

      expect(entries.map((e) => e.path)).toEqual(['/b-only']);
    });
  });

  describe('any-project fallback', () => {
    it('skips inactive and deleted projects so an active project keeps serving its page', async () => {
      const activeProject = makeProject({ id: 'active', slug: 'active-proj', isActive: true });
      const inactiveProject = makeProject({ id: 'inactive', slug: 'inactive-proj', isActive: false });
      const deletedProject = makeProject({
        id: 'deleted',
        slug: 'deleted-proj',
        isActive: true,
        deletedAt: new Date('2024-03-01T00:00:00Z'),
      });

      // Inactive & deleted projects have NEWER pages at the same path; the bug
      // would let them shadow the active project's older page and return 404.
      const activePage = makePage({
        id: 'active-page',
        projectId: 'active',
        path: '/services',
        title: 'Active Services',
        publishedAt: new Date('2024-01-01T00:00:00Z'),
      });
      const inactivePage = makePage({
        id: 'inactive-page',
        projectId: 'inactive',
        path: '/services',
        title: 'Inactive Services',
        publishedAt: new Date('2024-06-01T00:00:00Z'),
      });
      const deletedPage = makePage({
        id: 'deleted-page',
        projectId: 'deleted',
        path: '/services',
        title: 'Deleted Services',
        publishedAt: new Date('2024-07-01T00:00:00Z'),
      });

      const { service } = makeService(
        [activeProject, inactiveProject, deletedProject],
        [activePage, inactivePage, deletedPage],
        // No default project matches, forcing the any-project fallback.
        makeConfig({ 'public.defaultProjectSlug': 'no-such-default' }),
      );

      const dto = await service.getPublishedPageByPath('/services');

      expect(dto.title).toBe('Active Services');
    });

    it('throws 404 when only inactive/deleted projects have the page', async () => {
      const inactiveProject = makeProject({ id: 'inactive', slug: 'inactive-proj', isActive: false });
      const inactivePage = makePage({
        id: 'inactive-page',
        projectId: 'inactive',
        path: '/services',
        publishedAt: new Date('2024-06-01T00:00:00Z'),
      });

      const { service } = makeService(
        [inactiveProject],
        [inactivePage],
        makeConfig({ 'public.defaultProjectSlug': 'no-such-default' }),
      );

      await expect(service.getPublishedPageByPath('/services')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('canonical URL resolution', () => {
    const baseConfig = () => makeConfig({ 'public.defaultProjectSlug': 'home-proj' });

    function serviceForHome(project: Project, page: Page, config: ConfigService) {
      return makeService([project], [page], config).service;
    }

    it('returns null for an undomained project (no localhost) when no marketing origin is set', async () => {
      const project = makeProject({ slug: 'home-proj', domain: null });
      const page = makePage({ projectId: 'project-id', isHomepage: true, path: '/' });

      const dto = await serviceForHome(project, page, baseConfig()).getPublishedPageByPath('/');

      // Must be null rather than the old `https://localhost` invention.
      expect(dto.canonicalUrl).toBeNull();
    });

    it('uses the configured marketing origin when the project has no domain', async () => {
      const project = makeProject({ slug: 'home-proj', domain: null });
      const page = makePage({ projectId: 'project-id', isHomepage: true, path: '/' });
      const config = makeConfig({
        'public.defaultProjectSlug': 'home-proj',
        'public.marketingOrigin': 'https://www.solomiya-energy.com',
      });

      const dto = await serviceForHome(project, page, config).getPublishedPageByPath('/');

      expect(dto.canonicalUrl).toBe('https://www.solomiya-energy.com/');
    });

    it('builds canonical from the project domain when present', async () => {
      const project = makeProject({ slug: 'home-proj', domain: 'example.com' });
      const page = makePage({
        projectId: 'project-id',
        isHomepage: false,
        path: '/services',
      });

      const dto = await serviceForHome(project, page, baseConfig()).getPublishedPageByPath('/services');

      expect(dto.canonicalUrl).toBe('https://example.com/services');
    });

    it('prefers an explicit page canonical URL over derived values', async () => {
      const project = makeProject({ slug: 'home-proj', domain: 'example.com' });
      const page = makePage({
        projectId: 'project-id',
        path: '/services',
        canonicalUrl: 'https://canonical.example/custom',
      });

      const dto = await serviceForHome(project, page, baseConfig()).getPublishedPageByPath('/services');

      expect(dto.canonicalUrl).toBe('https://canonical.example/custom');
    });
  });
});
