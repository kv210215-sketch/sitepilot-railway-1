'use client';

import { Button, Card, CardBody, CardHeader, Input, Spinner, cn } from '@/components/ui';
import { usePage } from '@/hooks/usePages';
import { ExternalLink, Eye, RotateCcw, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const BLOCK_ICONS: Record<string, string> = {
  hero: '🦸', pain: '⚡', steps: '📋', numbers: '📊',
  audience: '👥', guarantees: '🛡', offers: '🎁', cta: '📣', faq: '❓',
};

const BLOCK_NAMES: Record<string, string> = {
  hero: 'Hero — Головний банер', pain: 'Pain — Болі та рішення',
  steps: 'Steps — Кроки роботи', numbers: 'Numbers — Цифри та факти',
  audience: 'Audience — Для кого', guarantees: 'Guarantees — Гарантії',
  offers: 'Offers — Спеціальна пропозиція', cta: 'CTA — Заклик до дії',
  faq: 'FAQ — Питання та відповіді',
};

function EditContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const { page, loading, saving, save, regenerateSeo } = usePage(projectId, params.id);

  const [tab, setTab] = useState<'blocks' | 'seo'>('blocks');
  const [seoForm, setSeoForm] = useState<Record<string, string>>({});
  const [seoInit, setSeoInit] = useState(false);

  if (loading) return <div className="flex justify-center py-16"><Spinner size={24} /></div>;
  if (!page) return <div className="text-center py-16 text-text2">Сторінку не знайдено</div>;

  // Ініціалізуємо SEO форму з даних сторінки
  if (!seoInit && page) {
    setSeoForm({
      seoTitle: page.seoTitle ?? '',
      seoDescription: page.seoDescription ?? '',
      seoKeywords: page.seoKeywords ?? '',
      ogTitle: page.ogTitle ?? '',
      ogDescription: page.ogDescription ?? '',
    });
    setSeoInit(true);
  }

  const saveSeo = () => save({ seo: seoForm as any });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <h1 className="font-display font-bold text-[17px]">{page.title}</h1>
          <p className="font-mono text-[12px] text-text3 mt-0.5">{page.urlPath ?? `/${page.slug}`}</p>
        </div>
        <a href={`/api/projects/${projectId}/pages/${page.id}/preview-html`} target="_blank">
          <Button variant="ghost" size="sm">
            <Eye size={13} /> Preview
          </Button>
        </a>
        <Button variant="ghost" size="sm" onClick={() =>
          router.push(`/pages/${page.id}/preview?projectId=${projectId}`)}>
          <ExternalLink size={13} /> Повний перегляд
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-5">
        {(['blocks', 'seo'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-text2 hover:text-text'
            )}
          >
            {t === 'blocks' ? '📦 Блоки контенту' : '🔍 SEO'}
          </button>
        ))}
      </div>

      {/* Blocks tab */}
      {tab === 'blocks' && (
        <div className="flex flex-col gap-3">
          {(page.content?.blocks ?? [])
            .sort((a, b) => a.order - b.order)
            .map(block => (
              <Card key={block.type + block.order}>
                <CardHeader title={`${BLOCK_ICONS[block.type] ?? '▪'} ${BLOCK_NAMES[block.type] ?? block.type}`}>
                  <span className="font-mono text-[10px] text-text3">order: {block.order}</span>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(block.data ?? {}).map(([key, val]) => {
                      if (typeof val === 'string') {
                        return (
                          <div key={key}>
                            <label className="text-[10px] font-semibold uppercase tracking-[.4px] text-text3 block mb-1">
                              {key}
                            </label>
                            <div className="text-[13px] text-text bg-surface2 rounded-sm px-3 py-2 min-h-[36px]">
                              {val || <span className="text-text3 italic">порожньо</span>}
                            </div>
                          </div>
                        );
                      }
                      if (Array.isArray(val)) {
                        return (
                          <div key={key} className="col-span-2">
                            <label className="text-[10px] font-semibold uppercase tracking-[.4px] text-text3 block mb-1">
                              {key} ({val.length} елементів)
                            </label>
                            <div className="bg-surface2 rounded-sm p-3 text-[12px] text-text2 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {JSON.stringify(val, null, 2)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardBody>
              </Card>
            ))}

          {(page.content?.blocks ?? []).length === 0 && (
            <div className="text-center py-12 text-text2 text-[13px]">
              Блоків немає — сторінка порожня
            </div>
          )}
        </div>
      )}

      {/* SEO tab */}
      {tab === 'seo' && (
        <div className="flex flex-col gap-5 max-w-2xl">
          <Card>
            <CardHeader title="Meta теги">
              <Button variant="ghost" size="sm" onClick={regenerateSeo} loading={saving}>
                <RotateCcw size={12} /> Перегенерувати
              </Button>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <div>
                <Input
                  label={`Meta Title (${seoForm.seoTitle?.length ?? 0}/70)`}
                  value={seoForm.seoTitle ?? ''}
                  onChange={e => setSeoForm({ ...seoForm, seoTitle: e.target.value })}
                  placeholder="СЕС для бізнесу Львів | Solomiya Energy"
                />
                <div className="mt-1">
                  <div className="bg-surface2 rounded h-1 overflow-hidden">
                    <div
                      className={cn('h-full transition-all', (seoForm.seoTitle?.length ?? 0) > 70 ? 'bg-danger' : 'bg-success')}
                      style={{ width: `${Math.min(100, ((seoForm.seoTitle?.length ?? 0) / 70) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[.4px] text-text2 block mb-1.5">
                  Meta Description ({seoForm.seoDescription?.length ?? 0}/160)
                </label>
                <textarea
                  rows={3}
                  value={seoForm.seoDescription ?? ''}
                  onChange={e => setSeoForm({ ...seoForm, seoDescription: e.target.value })}
                  placeholder="Встановимо сонячну станцію у Львові..."
                  className="w-full bg-surface2 border border-border2 rounded-sm px-3 py-2.5 text-[13.5px] text-text outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              <Input
                label="Keywords"
                value={seoForm.seoKeywords ?? ''}
                onChange={e => setSeoForm({ ...seoForm, seoKeywords: e.target.value })}
                placeholder="СЕС Львів, сонячні панелі, Solomiya Energy"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Open Graph (соц. мережі)" />
            <CardBody className="flex flex-col gap-4">
              <Input
                label="OG Title"
                value={seoForm.ogTitle ?? ''}
                onChange={e => setSeoForm({ ...seoForm, ogTitle: e.target.value })}
              />
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[.4px] text-text2 block mb-1.5">
                  OG Description
                </label>
                <textarea
                  rows={2}
                  value={seoForm.ogDescription ?? ''}
                  onChange={e => setSeoForm({ ...seoForm, ogDescription: e.target.value })}
                  className="w-full bg-surface2 border border-border2 rounded-sm px-3 py-2.5 text-[13.5px] text-text outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" onClick={saveSeo} loading={saving}>
              <Save size={13} /> Зберегти SEO
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditPagePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditContent params={params} />
    </Suspense>
  );
}
