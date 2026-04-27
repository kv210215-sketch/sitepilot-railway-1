'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  pagesService, Page, PaginatedPages, GeneratePageDto, BulkGenerateDto, Template,
} from '@/services/pages.service';

// ── usePages ──────────────────────────────────────────────────────────────────

export function usePages(projectId: string, params?: Record<string, unknown>) {
  const [data,    setData]    = useState<PaginatedPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await pagesService.list(projectId, params);
      setData(res.data);
      setError(null);
    } catch {
      setError('Не вдалося завантажити сторінки');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  const generatePage = async (dto: GeneratePageDto): Promise<Page | null> => {
    try {
      const res = await pagesService.generate(projectId, dto);
      toast.success('✅ Сторінку згенеровано!');
      await fetch();
      return res.data;
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message ?? 'Помилка генерації';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
      return null;
    }
  };

  const bulkGenerate = async (dto: BulkGenerateDto) => {
    try {
      const res = await pagesService.bulkGenerate(projectId, dto);
      toast.success(`✅ Створено ${res.data.created} сторінок!`);
      await fetch();
      return res.data;
    } catch {
      toast.error('Помилка масової генерації');
      return null;
    }
  };

  const archivePage = async (pageId: string) => {
    try {
      await pagesService.archive(projectId, pageId);
      toast.success('Сторінку архівовано');
      await fetch();
    } catch { toast.error('Помилка архівування'); }
  };

  const removePage = async (pageId: string) => {
    try {
      await pagesService.remove(projectId, pageId);
      toast.success('Сторінку видалено');
      await fetch();
    } catch { toast.error('Помилка видалення'); }
  };

  return { data, loading, error, refetch: fetch, generatePage, bulkGenerate, archivePage, removePage };
}

// ── useTemplates ──────────────────────────────────────────────────────────────

export function useTemplates(projectId?: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    pagesService.listTemplates(projectId)
      .then(r => setTemplates(r.data))
      .catch(() => toast.error('Не вдалося завантажити шаблони'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const byCategory = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category ?? 'other';
    acc[cat] = [...(acc[cat] ?? []), t];
    return acc;
  }, {});

  return { templates, byCategory, loading };
}

// ── usePage (single) ──────────────────────────────────────────────────────────

export function usePage(projectId: string, pageId: string) {
  const [page,    setPage]    = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!pageId || !projectId) return;
    pagesService.getOne(projectId, pageId)
      .then(r => setPage(r.data))
      .catch(() => toast.error('Сторінку не знайдено'))
      .finally(() => setLoading(false));
  }, [projectId, pageId]);

  const save = async (dto: Parameters<typeof pagesService.update>[2]) => {
    setSaving(true);
    try {
      const res = await pagesService.update(projectId, pageId, dto);
      setPage(res.data);
      toast.success('Збережено');
      return res.data;
    } catch {
      toast.error('Помилка збереження');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const regenerateSeo = async () => {
    setSaving(true);
    try {
      const res = await pagesService.regenerateSeo(projectId, pageId);
      setPage(res.data);
      toast.success('SEO перегенеровано');
    } catch {
      toast.error('Помилка генерації SEO');
    } finally {
      setSaving(false);
    }
  };

  return { page, loading, saving, save, regenerateSeo };
}
