'use client';

export const dynamic = 'force-dynamic';

import { EmptyState, Select, Spinner, cn } from '@/components/ui';
import { Lead, LeadStatus, leadsService } from '@/services/leads.service';
import { Project, projectsService } from '@/services/projects.service';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<LeadStatus, string> = {
  new:       'Новий',
  contacted: 'На зв’язку',
  qualified: 'Кваліфікований',
  converted: 'Конвертований',
  archived:  'Архів',
  spam:      'Спам',
};

const STATUS_COLOR: Record<LeadStatus, string> = {
  new:       'bg-accent/10 text-accent',
  contacted: 'bg-info/10 text-info',
  qualified: 'bg-purple/10 text-purple',
  converted: 'bg-success/10 text-success',
  archived:  'bg-surface2 text-text3',
  spam:      'bg-danger/10 text-danger',
};

const STATUS_FILTER_OPTIONS: Array<{ value: '' | LeadStatus; label: string }> = [
  { value: '',          label: 'Всі статуси' },
  { value: 'new',       label: 'Нові' },
  { value: 'contacted', label: 'На зв’язку' },
  { value: 'qualified', label: 'Кваліфіковані' },
  { value: 'converted', label: 'Конвертовані' },
  { value: 'archived',  label: 'Архів' },
  { value: 'spam',      label: 'Спам' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function LeadsContent() {
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId') ?? '';

  const [projects, setProjects]   = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Leads are project-scoped: resolve the project list first, then fetch
  // leads for the selected project.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await projectsService.list({ limit: 100 });
        if (cancelled) return;
        const list = res.data.data;
        setProjects(list);
        setProjectId(
          list.some(p => p.id === urlProjectId) ? urlProjectId : (list[0]?.id ?? ''),
        );
        if (list.length === 0) setLoading(false);
      } catch {
        if (cancelled) return;
        setError('Не вдалося завантажити проєкти');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [urlProjectId]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      const res = await leadsService.list(projectId, params);
      setLeads(res.data.data);
      setTotal(res.data.total);
    } catch {
      setError('Не вдалося завантажити ліди');
    } finally {
      setLoading(false);
    }
  }, [projectId, page, status]);

  useEffect(() => { load(); }, [load]);

  const projectName = projects.find(p => p.id === projectId)?.name ?? '';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="font-display font-bold text-[17px] flex-1">Ліди</h1>
        <span className="text-[12px] text-text3 bg-surface2 px-2.5 py-0.5 rounded-full">
          {total} лідів
        </span>
        {projects.length > 0 && (
          <Select
            value={projectId}
            onChange={e => { setProjectId(e.target.value); setPage(1); }}
            className="w-auto text-[12px] py-1.5"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        )}
        <Select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="w-auto text-[12px] py-1.5"
        >
          {STATUS_FILTER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Помилка завантаження"
          description={error}
          action={
            <button
              onClick={load}
              className="text-[13px] font-semibold text-accent hover:underline"
            >
              Спробувати ще раз
            </button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="🗂"
          title="Немає проєктів"
          description="Створіть проєкт і опублікуйте сторінку з формою, щоб отримувати ліди."
        />
      ) : leads.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Лідів ще немає"
          description={status
            ? 'За цим фільтром лідів не знайдено.'
            : `Заявки з форм проєкту «${projectName}» з’являться тут.`}
        />
      ) : (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Дата', 'Лід', 'Контакти', 'Повідомлення', 'Джерело', 'Статус'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.5px] text-text3 border-b border-border bg-surface2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-surface2/40 transition-colors align-top">
                  <td className="px-4 py-3 border-b border-border font-mono text-[11px] text-text3 whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>

                  <td className="px-4 py-3 border-b border-border">
                    <span className="text-[13px] font-medium text-text">{lead.name}</span>
                  </td>

                  <td className="px-4 py-3 border-b border-border">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="block text-[12px] text-accent hover:underline"
                      >
                        {lead.email}
                      </a>
                    ) : null}
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="block text-[12px] text-text2 hover:text-text"
                      >
                        {lead.phone}
                      </a>
                    ) : null}
                    {!lead.email && !lead.phone && (
                      <span className="text-[12px] text-text3 italic">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 border-b border-border max-w-[280px]">
                    {lead.message ? (
                      <span className="text-[12px] text-text2 line-clamp-3 whitespace-pre-wrap break-words">
                        {lead.message}
                      </span>
                    ) : (
                      <span className="text-[12px] text-text3">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                    <span className="text-[11px] text-text3 bg-surface2 px-1.5 py-0.5 rounded">
                      {lead.source}
                    </span>
                    {lead.pagePath && (
                      <span className="block font-mono text-[11px] text-text3 mt-1">
                        {lead.pagePath}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold',
                      STATUS_COLOR[lead.status] ?? 'bg-surface2 text-text3',
                    )}>
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-[12px] text-text3">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} з {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-[12px] text-text2 hover:text-text disabled:opacity-30 px-3 py-1.5 border border-border rounded-sm"
                >
                  ← Попередня
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * PAGE_SIZE >= total}
                  className="text-[12px] text-text2 hover:text-text disabled:opacity-30 px-3 py-1.5 border border-border rounded-sm"
                >
                  Наступна →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner size={24} /></div>}>
      <LeadsContent />
    </Suspense>
  );
}
