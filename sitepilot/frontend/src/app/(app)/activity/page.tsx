'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner, Select, cn } from '@/components/ui';
import { activityService, ActivityItem } from '@/services/publish.service';
import toast from 'react-hot-toast';

const DEFAULT_PROJECT = process.env.NEXT_PUBLIC_DEFAULT_PROJECT ?? '';

const ACTION_ICON: Record<string, string> = {
  publish_success:    '🚀',
  publish_failed:     '❌',
  publish_started:    '⏳',
  publish_cancelled:  '🚫',
  page_created:       '📄',
  page_updated:       '✏️',
  page_generated:     '⚡',
  page_archived:      '📦',
  page_deleted:       '🗑',
  template_applied:   '🎨',
  backup_created:     '💾',
  backup_restored:    '🔄',
  team_member_added:  '👥',
  team_member_removed:'👤',
  role_changed:       '🔑',
  content_changed:    '✏️',
  seo_updated:        '🔍',
  settings_changed:   '⚙️',
  project_created:    '🗂',
  project_updated:    '📝',
  user_login:         '🔐',
};

const ACTION_LABEL: Record<string, string> = {
  publish_success:   'Опубліковано',
  publish_failed:    'Помилка публікації',
  publish_started:   'Публікацію запущено',
  publish_cancelled: 'Публікацію скасовано',
  page_created:      'Сторінку створено',
  page_updated:      'Сторінку оновлено',
  page_generated:    'Сторінку згенеровано',
  page_archived:     'Сторінку архівовано',
  page_deleted:      'Сторінку видалено',
  template_applied:  'Шаблон застосовано',
  backup_created:    'Бекап створено',
  backup_restored:   'Бекап відновлено',
  team_member_added: 'Учасника додано',
  team_member_removed: 'Учасника видалено',
  role_changed:      'Роль змінено',
  content_changed:   'Контент змінено',
  seo_updated:       'SEO оновлено',
  settings_changed:  'Налаштування змінено',
  project_created:   'Проєкт створено',
  project_updated:   'Проєкт оновлено',
  user_login:        'Вхід у систему',
};

const ACTION_COLOR: Record<string, string> = {
  publish_success:  'bg-success/10',
  publish_failed:   'bg-danger/10',
  publish_started:  'bg-accent/10',
  page_generated:   'bg-info/10',
  backup_created:   'bg-accent/10',
  team_member_added:'bg-purple/10',
  default:          'bg-surface2',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}с тому`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}год тому`;
  return new Date(iso).toLocaleDateString('uk', { day: 'numeric', month: 'short' });
}

export default function ActivityPage() {
  const searchParams = useSearchParams();
  const projectId    = searchParams.get('projectId') ?? DEFAULT_PROJECT;

  const [items,    setItems]    = useState<ActivityItem[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [filter,   setFilter]   = useState('');

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 50 };
      if (filter) params.action = filter;
      const res = await activityService.list(projectId, params);
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Не вдалося завантажити активність');
    } finally {
      setLoading(false);
    }
  }, [projectId, page, filter]);

  useEffect(() => { load(); }, [load]);

  const FILTER_OPTIONS = [
    { value: '', label: 'Всі дії' },
    { value: 'publish_success',  label: '🚀 Публікації успішні' },
    { value: 'publish_failed',   label: '❌ Помилки публікації' },
    { value: 'page_generated',   label: '⚡ Генерації сторінок' },
    { value: 'page_updated',     label: '✏️ Редагування' },
    { value: 'seo_updated',      label: '🔍 SEO оновлення' },
    { value: 'backup_created',   label: '💾 Бекапи' },
    { value: 'team_member_added',label: '👥 Команда' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="font-display font-bold text-[17px] flex-1">Журнал активності</h1>
        <span className="text-[12px] text-text3 bg-surface2 px-2.5 py-0.5 rounded-full">
          {total} записів
        </span>
        <Select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="w-auto text-[12px] py-1.5"
        >
          {FILTER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-text3 text-[13px]">
          Активності ще немає
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Час', 'Дія', "Об'єкт", 'Користувач', 'Деталі'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.5px] text-text3 border-b border-border bg-surface2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const icon  = ACTION_ICON[item.action]  ?? '▪';
                const label = ACTION_LABEL[item.action] ?? item.action;
                const bg    = ACTION_COLOR[item.action] ?? ACTION_COLOR.default;

                return (
                  <tr key={item.id} className="hover:bg-surface2/40 transition-colors group">
                    <td className="px-4 py-3 border-b border-border font-mono text-[11px] text-text3 whitespace-nowrap">
                      {timeAgo(item.createdAt)}
                    </td>

                    <td className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0',
                          bg
                        )}>
                          {icon}
                        </span>
                        <span className="text-[13px] font-medium text-text">{label}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 border-b border-border">
                      {item.entityName ? (
                        <span className="text-[13px] text-text2">{item.entityName}</span>
                      ) : (
                        <span className="text-[12px] text-text3 italic">—</span>
                      )}
                      {item.entityType && (
                        <span className="text-[10px] text-text3 ml-2 bg-surface2 px-1.5 py-0.5 rounded">
                          {item.entityType}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {item.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] text-text2">{item.userName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 border-b border-border">
                      {Object.keys(item.changes).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-[11px] text-text3 hover:text-text">
                            {Object.keys(item.changes).length} змін
                          </summary>
                          <pre className="text-[10px] text-text2 mt-1 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                            {JSON.stringify(item.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-[12px] text-text3">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-[12px] text-text3">
                {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} з {total}
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
                  disabled={page * 50 >= total}
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
