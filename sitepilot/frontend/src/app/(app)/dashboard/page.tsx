'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderOpen, FileText, Rocket, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, Progress, Spinner } from '@/components/ui';
import api from '@/lib/api-client';

interface DashboardStats {
  projectsTotal:  number;
  pagesTotal:     number;
  publishTotal:   number;
  errorsTotal:    number;
  publishSuccess: number;
  publishAvgMs:   number;
}

interface ActivityItem {
  id: string; action: string; entityName: string | null;
  userName: string | null; projectName: string | null; createdAt: string;
}

interface QueueItem {
  id: string; scope: string; status: string;
  pagesTotal: number; pagesSuccess: number; pagesFailed: number;
  durationMs: number | null; projectName: string;
}

function StatCard({
  label, value, change, icon: Icon, accent,
}: {
  label: string; value: number | string; change: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className={`bg-surface border border-border rounded-[10px] p-5 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:rounded-t-[10px] ${accent}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-text2 mb-2">{label}</p>
      <p className="font-display font-extrabold text-[28px] mb-1">{value}</p>
      <p className="text-[12px] text-success">{change}</p>
      <Icon size={22} className="absolute right-4 top-4 opacity-10" />
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    publish_success: '🚀 Опубліковано',
    publish_failed:  '❌ Помилка публікації',
    content_changed: '✏️ Змінено контент',
    page_created:    '📄 Створено сторінку',
    team_member_added: '👥 Додано учасника',
    backup_created:  '💾 Бекап створено',
  };
  return map[action] ?? action;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}с`;
  if (diff < 3600) return `${Math.floor(diff / 60)}хв`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}год`;
  return `${Math.floor(diff / 86400)}д`;
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [queue,    setQueue]    = useState<QueueItem[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Parallel fetch — якщо endpoints ще не готові, fallback до mock
        const [sRes, aRes, qRes] = await Promise.allSettled([
          api.get<DashboardStats>('/analytics/dashboard'),
          api.get<ActivityItem[]>('/activity?limit=6'),
          api.get<QueueItem[]>('/publish/queue?limit=4'),
        ]);

        if (sRes.status === 'fulfilled') setStats(sRes.value.data);
        if (aRes.status === 'fulfilled') setActivity(aRes.value.data);
        if (qRes.status === 'fulfilled') setQueue(qRes.value.data);
      } catch { /* буде показано mock */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Mock для демонстрації поки API не готове
  const mockStats: DashboardStats = {
    projectsTotal: 3, pagesTotal: 47, publishTotal: 128,
    errorsTotal: 2, publishSuccess: 126, publishAvgMs: 1200,
  };
  const s = stats ?? mockStats;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div>
      {/* Stat grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Проєкти"    value={s.projectsTotal} change="↑ 1 цього місяця" icon={FolderOpen}     accent="before:bg-accent" />
        <StatCard label="Сторінки"   value={s.pagesTotal}    change="↑ 12 за тиждень"  icon={FileText}       accent="before:bg-success" />
        <StatCard label="Публікацій" value={s.publishTotal}  change="↑ 8 сьогодні"     icon={Rocket}         accent="before:bg-info" />
        <StatCard label="Помилки"    value={s.errorsTotal}   change="↓ 5 за тиждень"   icon={AlertTriangle}  accent="before:bg-danger" />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4">

        {/* Activity feed */}
        <Card>
          <CardHeader title="Остання активність">
            <Link href="/activity" className="text-[12px] text-text2 hover:text-text transition-colors">
              Всі →
            </Link>
          </CardHeader>
          <div className="px-[18px]">
            {(activity.length > 0 ? activity : MOCK_ACTIVITY).map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-none">
                <div className="w-7 h-7 rounded-lg bg-surface2 flex items-center justify-center text-[13px] flex-shrink-0 mt-0.5">
                  {actionLabel(item.action).split(' ')[0]}
                </div>
                <div className="flex-1 text-[13px] leading-snug">
                  <strong className="text-text font-semibold">{item.userName ?? 'System'}</strong>
                  {' · '}
                  <span className="text-text2">{actionLabel(item.action).split(' ').slice(1).join(' ')}</span>
                  {item.entityName && (
                    <span className="text-text2"> «{item.entityName}»</span>
                  )}
                  {item.projectName && (
                    <><br /><span className="text-accent text-[12px]">{item.projectName}</span></>
                  )}
                </div>
                <span className="font-mono text-[11px] text-text3 mt-0.5 whitespace-nowrap">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Publish queue */}
          <Card>
            <CardHeader title="Черга публікацій">
              <Badge variant="processing">
                {(queue.length > 0 ? queue : MOCK_QUEUE).filter(q => q.status === 'processing' || q.status === 'queued').length} активних
              </Badge>
            </CardHeader>
            <div>
              {(queue.length > 0 ? queue : MOCK_QUEUE).map((job) => (
                <div key={job.id} className="flex items-center gap-3 px-[18px] py-3 border-b border-border last:border-none">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{job.projectName}</p>
                    <p className="text-[11px] text-text2">{job.scope} · спроба 1/3</p>
                  </div>
                  <div className="w-20 flex-shrink-0">
                    {job.status === 'processing' && (
                      <>
                        <Progress
                          value={job.pagesTotal > 0 ? (job.pagesSuccess / job.pagesTotal) * 100 : 0}
                          color="accent"
                        />
                        <p className="font-mono text-[10px] text-text3 mt-0.5 text-right">
                          {job.pagesSuccess}/{job.pagesTotal}
                        </p>
                      </>
                    )}
                  </div>
                  <Badge
                    variant={job.status as 'processing' | 'queued' | 'success' | 'failed'}
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* System health */}
          <Card>
            <CardHeader title="Здоров'я системи" />
            <CardBody className="flex flex-col gap-4">
              {[
                { label: 'Успішність публ.', value: `${((s.publishSuccess / Math.max(s.publishTotal, 1)) * 100).toFixed(1)}%`, pct: (s.publishSuccess / Math.max(s.publishTotal, 1)) * 100, color: 'success' as const },
                { label: 'Середній час',     value: `${(s.publishAvgMs / 1000).toFixed(1)}s`, pct: Math.min(100, s.publishAvgMs / 50),    color: 'accent'  as const },
                { label: 'Помилки (тижд.)',  value: `${s.errorsTotal}`,  pct: Math.min(100, s.errorsTotal * 10), color: 'danger'  as const },
              ].map(({ label, value, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1.5 text-[13px]">
                    <span className="text-text2">{label}</span>
                    <span className="font-mono font-semibold text-text">{value}</span>
                  </div>
                  <Progress value={pct} color={color} />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Mock data (використовується поки backend не підключений) ───────────────────
const MOCK_ACTIVITY: ActivityItem[] = [
  { id:'1', action:'publish_success', entityName:'Головна',  userName:'Іван П.',   projectName:'solomiya-energy.com', createdAt: new Date(Date.now()-120_000).toISOString() },
  { id:'2', action:'content_changed', entityName:'SEO поля', userName:'Олена К.',  projectName:'solomiya-energy.com', createdAt: new Date(Date.now()-1_080_000).toISOString() },
  { id:'3', action:'team_member_added',entityName:'Марія Б.',userName:'Admin',     projectName:'solar-b2b.com',       createdAt: new Date(Date.now()-3_600_000).toISOString() },
  { id:'4', action:'publish_failed',  entityName:'Контакти', userName:'Іван П.',   projectName:'solomiya-energy.com', createdAt: new Date(Date.now()-10_800_000).toISOString() },
  { id:'5', action:'backup_created',  entityName:'Auto',     userName:null,        projectName:'solomiya-energy.com', createdAt: new Date(Date.now()-21_600_000).toISOString() },
];

const MOCK_QUEUE: QueueItem[] = [
  { id:'j1', scope:'project', status:'processing', pagesTotal:47, pagesSuccess:31, pagesFailed:0, durationMs:1400, projectName:'solomiya-energy.com' },
  { id:'j2', scope:'page',    status:'queued',     pagesTotal:1,  pagesSuccess:0,  pagesFailed:0, durationMs:null, projectName:'solar-b2b.com' },
];
