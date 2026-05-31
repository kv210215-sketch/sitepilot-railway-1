import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PageStatus = 'draft' | 'generated' | 'ready' | 'published' | 'archived' | 'scheduled';

export interface PageBlock {
  type:  string;
  order: number;
  data:  Record<string, unknown>;
}

export interface PageSeo {
  seoTitle?:       string;
  seoDescription?: string;
  seoKeywords?:    string;
  ogTitle?:        string;
  ogDescription?:  string;
  ogImageUrl?:     string;
  canonicalUrl?:   string;
  robots?:         string;
}

export interface Page {
  id:             string;
  projectId:      string;
  title:          string;
  slug:           string;
  path:           string | null;
  status:         PageStatus;
  templateId:     string | null;
  content:        { blocks: PageBlock[] };
  previewHtml:    string | null;
  seoTitle:       string | null;
  seoDescription: string | null;
  seoKeywords:    string | null;
  ogTitle:        string | null;
  ogDescription:  string | null;
  ogImageUrl:     string | null;
  canonicalUrl:   string | null;
  robots:         string;
  sortOrder:      number;
  publishedAt:    string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface PaginatedPages {
  data:       Page[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface Template {
  id:          string;
  name:        string;
  description: string | null;
  category:    string | null;
  tags:        string[];
  isGlobal:    boolean;
  usageCount:  number;
  structure: {
    blocks:      Array<{ type: string; order: number; required: boolean }>;
    requiredVars: string[];
  };
}

export interface GeneratePageDto {
  templateId:   string;
  title:        string;
  city?:        string;
  power?:       number;
  audience?:    'home' | 'business';
  customFields?: Record<string, string>;
}

export interface BulkGenerateDto {
  templateId:    string;
  cities:        string[];
  audience?:     'home' | 'business';
  power?:        number;
  titlePattern:  string;
}

export interface TildaExport {
  pageTitle:  string;
  slug:       string;
  urlPath:    string;
  seo:        PageSeo;
  blocks:     Array<{
    order:          number;
    type:           string;
    tildaBlockName: string;
    instructions:   string;
    fields:         Record<string, string>;
  }>;
  totalBlocks:       number;
  estimatedMinutes:  number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

const pagesBase = (projectId: string) => `/projects/${projectId}/pages`;

export const pagesService = {
  // Pages
  list:   (projectId: string, params?: Record<string, unknown>) =>
    api.get<PaginatedPages>(pagesBase(projectId), { params }),

  getOne: (projectId: string, pageId: string) =>
    api.get<Page>(`${pagesBase(projectId)}/${pageId}`),

  create: (projectId: string, dto: { title: string; slug?: string; templateId?: string }) =>
    api.post<Page>(pagesBase(projectId), dto),

  generate: (projectId: string, dto: GeneratePageDto) =>
    api.post<Page>(`${pagesBase(projectId)}/generate`, dto),

  bulkGenerate: (projectId: string, dto: BulkGenerateDto) =>
    api.post<{ created: number; pages: Array<{ city: string; slug: string; id: string }> }>(
      `${pagesBase(projectId)}/bulk-generate`, dto
    ),

  update: (projectId: string, pageId: string, dto: Partial<Page> & { seo?: PageSeo }) =>
    api.patch<Page>(`${pagesBase(projectId)}/${pageId}`, dto),

  regenerateSeo: (projectId: string, pageId: string) =>
    api.post<Page>(`${pagesBase(projectId)}/${pageId}/regenerate-seo`),

  archive: (projectId: string, pageId: string) =>
    api.patch(`${pagesBase(projectId)}/${pageId}/archive`),

  remove: (projectId: string, pageId: string) =>
    api.delete(`${pagesBase(projectId)}/${pageId}`),

  preview: (projectId: string, pageId: string) =>
    api.get<{ html: string }>(`${pagesBase(projectId)}/${pageId}/preview`),

  exportTilda: (projectId: string, pageId: string) =>
    api.get<TildaExport>(`${pagesBase(projectId)}/${pageId}/export-tilda`),

  // Templates
  listTemplates: (projectId?: string) =>
    api.get<Template[]>('/templates', { params: { projectId } }),
};
