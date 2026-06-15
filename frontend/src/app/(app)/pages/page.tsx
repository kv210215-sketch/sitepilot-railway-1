'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, RefreshCw, Archive, Trash2, Eye, Edit3, Zap } from 'lucide-react';
import {
  Button, Badge, Select, Card, EmptyState, Spinner, Progress, cn,
} from '@/components/ui';
import { usePages } from '@/hooks/usePages';
import { useActiveProject } from '@/hooks/useActiveProject';
import { Page, PageStatus } from '@/services/pages.service';
import toast from 'react-hot-toast';

// Отримуємо projectId з URL або беремо перший доступний
const DEFAULT_PROJECT = process.env.NEXT_PUBLIC_DEFAULT_PROJECT ?? '';

const STATUS_VARIANT: Record<PageStatus, 'active' | 'draft' | 'archived' | 'queued' | 'success'> = {
  draft:     'draft',
  generated: 'queued',
  ready:     'success',
  published: 'active',
  archived:  'archived',
  scheduled: 'queued',
};

const STATUS_LABEL: Record<PageStatus, string> = {
  draft:     'Чернетка',
  generated: 'Згенеровано',
  ready:     'Готово',
  published: 'Опубліковано',
  archived:  'Архів',
  scheduled: 'Заплановано',
};

function SeoScore({ page }: { page: Page }) {
  let score = 0;
  if (page.seoTitle)       score += 30;
  if (page.seoDescription) score += 30;
  if (page.seoKeywords)    score += 10;
  if (page.ogTitle)        score += 15;
  if (page.ogDescription)  score += 15;

  const color = score >= 80 ? 'success' : score >= 50 ? 'accent' : 'danger';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <Progress value={score} color={color} />
      <span className="font-mono text-[11px] text-text2 w-7 text-right">{score}</span>
    </div>
  );
}

function PagesContent() {
  const searchParams = useSearchParams();
  const explicitId   = searchParams.get('projectId') ?? DEFAULT_PROJECT;
  // Fall back to the first available project when no projectId is provided,
  // so the screen always has context instead of spinning forever.
  const { projectId, projectsLoading } = useActiveProject(explicitId);

  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState<Set<string>>(new Set());

  const { data, loading, refetch, archivePage, removePage } = usePages(projectId, {
    ...(statusFilter && { status: statusFilter }),
    ...(search       && { search }),
  });

  const pages = data?.data ?? [];

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = pages.length > 0 && selected.size === pages.length;
  const toggleAll   = () =>
    setSelected(allSelected ? new Set() : new Set(pages.map(p => p.id)));

  // Bulk publish selected
  const bulkPublish = () => {
    toast.success(`🚀 ${selected.size} сторінок поставлено в чергу публікації`);
    setSelected(new Set());
  };

  if (loading || projectsLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="font-display font-bold text-[17px] flex-1">Сторінки</h1>
        {data && (
          <span className="text-[11px] text-text3 bg-surface2 px-2 py-0.5 rounded-full">
            {data.total} сторінок
          </span>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface2 border border-border2 rounded-sm px-3 py-1.5 w-44">
          <input
            type="text"
            placeholder="Пошук..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[13px] text-text placeholder:text-text3 w-full"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-auto text-[12px] py-1.5"
        >
          <option value="">Всі статуси</option>
          <option value="draft">Чернетка</option>
          <option value="generated">Згенеровано</option>
          <option value="ready">Готово</option>
          <option value="published">Опубліковано</option>
          <option value="archived">Архів</option>
        </Select>

        <Link href={`/pages/new?projectId=${projectId}`}>
          <Button variant="primary">
            <Plus size={13} strokeWidth={2.5} />
            Нова сторінка
          </Button>
        </Link>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-surface border border-accent/30 rounded-sm">
          <span className="text-[13px] font-medium text-accent">{selected.size} обрано</span>
          <Button variant="primary" size="sm" onClick={bulkPublish}>
            <Zap size={12} /> Publish вибрані
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Скасувати
          </Button>
        </div>
      )}

      {/* Table */}
      {pages.length === 0 ? (
        <Card>
          <EmptyState
            icon="📄"
            title="Сторінок ще немає"
            description="Створіть першу сторінку або згенеруйте з шаблону"
            action={
              <Link href={`/pages/new?projectId=${projectId}`}>
                <Button variant="primary"><Plus size={13} />Нова сторінка</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-10 px-4 py-2.5 border-b border-border bg-surface2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="accent-accent w-3.5 h-3.5"
                  />
                </th>
                {['Назва / URL', 'Статус', 'SEO', 'Шаблон', 'Оновлено', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.5px] text-text3 border-b border-border bg-surface2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id} className="hover:bg-surface2/50 transition-colors group">
                  <td className="px-4 py-3 border-b border-border">
                    <input
                      type="checkbox"
                      checked={selected.has(page.id)}
                      onChange={() => toggleSelect(page.id)}
                      className="accent-accent w-3.5 h-3.5"
                    />
                  </td>

                  <td className="px-4 py-3 border-b border-border">
                    <div className="font-semibold text-[13.5px] text-text">{page.title}</div>
                    <div className="font-mono text-[11px] text-text3 mt-0.5">{page.urlPath ?? `/${page.slug}`}</div>
                  </td>

                  <td className="px-4 py-3 border-b border-border">
                    <Badge variant={STATUS_VARIANT[page.status]}>
                      {STATUS_LABEL[page.status]}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 border-b border-border">
                    <SeoScore page={page} />
                  </td>

                  <td className="px-4 py-3 border-b border-border text-[12px] text-text2">
                    {page.templateId ? (
                      <span className="bg-surface2 px-2 py-0.5 rounded text-[11px] text-text3">З шаблону</span>
                    ) : '—'}
                  </td>

                  <td className="px-4 py-3 border-b border-border font-mono text-[11px] text-text3">
                    {new Date(page.updatedAt).toLocaleDateString('uk')}
                  </td>

                  <td className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/pages/${page.id}/preview?projectId=${projectId}`}>
                        <button className="p-1.5 rounded hover:bg-surface3 text-text2 hover:text-text transition-colors" title="Preview">
                          <Eye size={14} />
                        </button>
                      </Link>
                      <Link href={`/pages/${page.id}/edit?projectId=${projectId}`}>
                        <button className="p-1.5 rounded hover:bg-surface3 text-text2 hover:text-text transition-colors" title="Редагувати">
                          <Edit3 size={14} />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 rounded hover:bg-surface3 text-text2 hover:text-danger transition-colors"
                        title="Архівувати"
                        onClick={() => archivePage(page.id)}
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-[12px] text-text3">
                Сторінка {data.page} з {data.totalPages} · {data.total} записів
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">← Попередня</Button>
                <Button variant="ghost" size="sm">Наступна →</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PagesContent />
    </Suspense>
  );
}
