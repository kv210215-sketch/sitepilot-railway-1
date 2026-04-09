'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, RefreshCw, StopCircle, RotateCcw, FileText } from 'lucide-react';
import { Button, Badge, Progress, Card, CardHeader, CardBody, Modal, Spinner, cn } from '@/components/ui';
import { publishService, PublishJob, PublishStatus, PublishScope, PublishStats } from '@/services/publish.service';
import toast from 'react-hot-toast';

const DEFAULT_PROJECT = process.env.NEXT_PUBLIC_DEFAULT_PROJECT ?? '';

const STATUS_LABEL: Record<PublishStatus, string> = {
  pending:    'Очікування',
  queued:     'В черзі',
  processing: 'Виконується',
  success:    'Успішно',
  failed:     'Помилка',
  cancelled:  'Скасовано',
  retrying:   'Повтор',
};

const STATUS_VARIANT: Record<PublishStatus, any> = {
  pending:    'draft',
  queued:     'queued',
  processing: 'processing',
  success:    'success',
  failed:     'failed',
  cancelled:  'draft',
  retrying:   'processing',
};

const SCOPE_LABEL: Record<PublishScope, string> = {
  page:     '📄 Сторінка',
  project:  '🗂 Весь проєкт',
  selected: '☑ Вибрані',
};

function ProgressBar({ job }: { job: PublishJob }) {
  if (job.pagesTotal === 0) return null;
  const pct = Math.round((job.pagesSuccess / job.pagesTotal) * 100);
  const color = job.status === 'failed' ? 'danger'
              : job.status === 'success' ? 'success'
              : 'accent';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Progress value={pct} color={color} />
      <span className="font-mono text-[11px] text-text2 whitespace-nowrap">
        {job.pagesSuccess}/{job.pagesTotal}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-surface2 rounded-[8px] p-4">
      <p className="text-[11px] text-text3 uppercase tracking-[.5px] mb-1">{label}</p>
      <p className={cn('font-display font-bold text-[24px]', color ?? 'text-text')}>{value}</p>
      {sub && <p className="text-[11px] text-text3 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PublishPage() {
  const searchParams = useSearchParams();
  const projectId    = searchParams.get('projectId') ?? DEFAULT_PROJECT;

  const [jobs,    setJobs]    = useState<PublishJob[]>([]);
  const [stats,   setStats]   = useState<PublishStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs,    setLogs]    = useState<any[] | null>(null);
  const [logsJob, setLogsJob] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [jobsRes, statsRes] = await Promise.all([
        publishService.list(projectId, { limit: 30 }),
        publishService.stats(projectId),
      ]);
      setJobs(jobsRes.data.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Не вдалося завантажити черги');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Авто-оновлення кожні 5 сек якщо є активні jobs
  useEffect(() => {
    const hasActive = jobs.some(j =>
      j.status === 'processing' || j.status === 'queued' || j.status === 'pending'
    );
    if (!hasActive) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [jobs, load]);

  const publishAll = async () => {
    setPublishing(true);
    try {
      await publishService.create(projectId, { scope: 'project' });
      toast.success('🚀 Publish All запущено!');
      await load();
    } catch { toast.error('Помилка запуску publish'); }
    finally { setPublishing(false); }
  };

  const retry = async (jobId: string) => {
    try {
      await publishService.retry(projectId, jobId);
      toast.success('🔄 Retry запущено');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Помилка retry');
    }
  };

  const cancel = async (jobId: string) => {
    try {
      await publishService.cancel(projectId, jobId);
      toast.success('Job скасовано');
      await load();
    } catch { toast.error('Помилка скасування'); }
  };

  const openLogs = async (jobId: string) => {
    setLogsJob(jobId);
    const res = await publishService.getLogs(projectId, jobId);
    setLogs(res.data);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={24} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="font-display font-bold text-[17px] flex-1">Publish Queue</h1>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={12} /> Оновити
        </Button>
        <Button variant="primary" onClick={publishAll} loading={publishing}>
          <Zap size={13} /> Publish All
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Всього jobs"   value={stats.total} />
          <StatCard label="Активних"      value={stats.activeJobs}
            color={stats.activeJobs > 0 ? 'text-accent' : 'text-text'} />
          <StatCard label="Успішність"    value={`${stats.successRate}%`}
            color={stats.successRate >= 90 ? 'text-success' : 'text-danger'} />
          <StatCard label="Середній час"  value={`${(stats.avgDurationMs / 1000).toFixed(1)}s`} />
        </div>
      )}

      {/* Jobs table */}
      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Job ID', 'Проєкт / Тип', 'Статус', 'Прогрес', 'Час', 'Спроба', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.5px] text-text3 border-b border-border bg-surface2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text3 text-[13px]">
                  Черга порожня
                </td>
              </tr>
            ) : jobs.map(job => (
              <tr key={job.id} className="hover:bg-surface2/40 transition-colors">
                <td className="px-4 py-3 border-b border-border font-mono text-[11px] text-text3">
                  {job.id.slice(0, 8)}...
                </td>

                <td className="px-4 py-3 border-b border-border">
                  <div className="text-[13px] font-medium">{SCOPE_LABEL[job.scope]}</div>
                  {job.initiatorName && (
                    <div className="text-[11px] text-text3 mt-0.5">{job.initiatorName}</div>
                  )}
                </td>

                <td className="px-4 py-3 border-b border-border">
                  <Badge variant={STATUS_VARIANT[job.status]}>
                    {STATUS_LABEL[job.status]}
                  </Badge>
                  {job.errorMessage && (
                    <div className="text-[10px] text-danger mt-1 max-w-[160px] truncate" title={job.errorMessage}>
                      {job.errorMessage}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 border-b border-border">
                  <ProgressBar job={job} />
                </td>

                <td className="px-4 py-3 border-b border-border font-mono text-[11px] text-text2">
                  {job.durationMs
                    ? `${(job.durationMs / 1000).toFixed(1)}s`
                    : job.status === 'processing'
                    ? <span className="text-accent animate-pulse">...</span>
                    : '—'}
                </td>

                <td className="px-4 py-3 border-b border-border text-center font-mono text-[11px]"
                    style={{ color: job.attempt >= job.maxAttempts ? '#ef4444' : undefined }}>
                  {job.attempt}/{job.maxAttempts}
                </td>

                <td className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-1">
                    {/* Logs */}
                    <button
                      onClick={() => openLogs(job.id)}
                      className="p-1.5 rounded hover:bg-surface3 text-text2 hover:text-text transition-colors"
                      title="Логи"
                    >
                      <FileText size={13} />
                    </button>

                    {/* Retry */}
                    {job.status === 'failed' && job.attempt < job.maxAttempts && (
                      <button
                        onClick={() => retry(job.id)}
                        className="p-1.5 rounded hover:bg-surface3 text-success hover:text-success transition-colors"
                        title="Retry"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}

                    {/* Cancel */}
                    {(job.status === 'queued' || job.status === 'pending') && (
                      <button
                        onClick={() => cancel(job.id)}
                        className="p-1.5 rounded hover:bg-surface3 text-danger hover:text-danger transition-colors"
                        title="Скасувати"
                      >
                        <StopCircle size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Logs modal */}
      <Modal
        open={!!logsJob}
        onClose={() => { setLogsJob(null); setLogs(null); }}
        title="Логи publish job"
        icon="📋"
      >
        {!logs ? (
          <div className="flex justify-center py-8"><Spinner size={20} /></div>
        ) : (
          <div className="max-h-80 overflow-y-auto flex flex-col gap-1.5">
            {logs.map((log: any) => (
              <div key={log.id} className={cn(
                'flex items-start gap-2 text-[12px] font-mono p-2 rounded-sm',
                log.level === 'error' ? 'bg-danger/5 text-danger'
                : log.level === 'warn'  ? 'bg-accent/5 text-accent'
                : 'bg-surface2 text-text2'
              )}>
                <span className="text-[10px] text-text3 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString('uk')}
                </span>
                <span className={cn(
                  'text-[10px] font-bold w-9 flex-shrink-0',
                  log.level === 'error' ? 'text-danger' : log.level === 'warn' ? 'text-accent' : 'text-text3'
                )}>
                  {log.level.toUpperCase()}
                </span>
                <span className="flex-1">{log.message}</span>
                {log.durationMs && (
                  <span className="text-[10px] text-text3">{log.durationMs}ms</span>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-text3 text-[13px] py-6">Логів ще немає</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
