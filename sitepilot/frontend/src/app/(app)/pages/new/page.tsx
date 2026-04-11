'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Input, Select, Spinner, cn } from '@/components/ui';
import { useTemplates } from '@/hooks/usePages';
import { pagesService, Template } from '@/services/pages.service';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<string, string> = {
  home:      '🏠 Для дому',
  business:  '🏢 Для бізнесу',
  power:     '⚡ За потужністю',
  seo_city:  '📍 SEO під місто',
  seasonal:  '🎯 Акційні',
  b2b:       '🤝 B2B',
};

const UA_CITIES = [
  'Львів','Київ','Харків','Одеса','Дніпро','Запоріжжя',
  'Вінниця','Полтава','Чернівці','Івано-Франківськ',
  'Тернопіль','Луцьк','Рівне','Житомир','Суми','Херсон',
];

type Step = 'template' | 'params' | 'preview';

function NewPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const projectId    = searchParams.get('projectId') ?? '';

  const { byCategory, loading: tplLoading } = useTemplates(projectId);
  const [step,     setStep]     = useState<Step>('template');
  const [selected, setSelected] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title:    '',
    city:     '',
    power:    '',
    audience: '' as '' | 'home' | 'business',
  });

  // ── Step 1: Вибір шаблону ─────────────────────────────────────────────────

  const StepTemplate = () => (
    <div>
      <h2 className="font-display font-bold text-[15px] mb-5">Оберіть шаблон</h2>
      {tplLoading ? (
        <div className="flex justify-center py-12"><Spinner size={24} /></div>
      ) : (
        Object.entries(byCategory).map(([cat, templates]) => (
          <div key={cat} className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-text3 mb-3">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={cn(
                    'border rounded-[10px] p-4 cursor-pointer transition-all',
                    selected?.id === t.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border2 bg-surface'
                  )}
                >
                  <div className="font-semibold text-[13px] mb-1">{t.name}</div>
                  <div className="text-[11px] text-text2 mb-2 line-clamp-2">{t.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {t.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-surface2 px-1.5 py-0.5 rounded text-text3">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-text3 mt-2 font-mono">
                    {t.structure.blocks.length} блоків
                    {t.usageCount > 0 && ` · ${t.usageCount} використань`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── Step 2: Параметри ─────────────────────────────────────────────────────

  const requiredVars = selected?.structure.requiredVars ?? [];

  const StepParams = () => (
    <div>
      <h2 className="font-display font-bold text-[15px] mb-2">Параметри сторінки</h2>
      <p className="text-[13px] text-text2 mb-5">
        Шаблон: <strong className="text-text">{selected?.name}</strong>
      </p>

      <div className="flex flex-col gap-4 max-w-md">
        <Input
          label="Назва сторінки *"
          placeholder={
            selected?.category === 'seo_city'
              ? 'СЕС для дому у Львові'
              : selected?.category === 'power'
              ? 'СЕС 10 кВт — Solomiya Energy'
              : 'Назва сторінки'
          }
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />

        {/* Місто — обов'язкове для seo_city */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[.4px] text-text2 block mb-1.5">
            Місто {requiredVars.includes('city') && <span className="text-danger">*</span>}
          </label>
          <select
            className="w-full bg-surface2 border border-border2 rounded-sm px-3 py-2.5 text-[13.5px] text-text outline-none focus:border-accent transition-colors"
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
          >
            <option value="">— Не вказано —</option>
            {UA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Аудиторія */}
        <Select
          label="Аудиторія"
          value={form.audience}
          onChange={e => setForm({ ...form, audience: e.target.value as '' | 'home' | 'business' })}
        >
          <option value="">— Не вказано —</option>
          <option value="home">Для дому</option>
          <option value="business">Для бізнесу</option>
        </Select>

        {/* Потужність — для power шаблонів */}
        {(selected?.category === 'power' || requiredVars.includes('power')) && (
          <Select
            label={`Потужність кВт ${requiredVars.includes('power') ? '*' : ''}`}
            value={form.power}
            onChange={e => setForm({ ...form, power: e.target.value })}
          >
            <option value="">— Оберіть —</option>
            {[5, 10, 20, 30, 50].map(p => (
              <option key={p} value={p}>{p} кВт</option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!form.title.trim()) { toast.error('Введіть назву сторінки'); return; }
    if (requiredVars.includes('city') && !form.city) { toast.error('Оберіть місто'); return; }
    if (!selected) return;

    setCreating(true);
    try {
      const res = await pagesService.generate(projectId, {
        templateId: selected.id,
        title:      form.title.trim(),
        city:       form.city   || undefined,
        power:      form.power  ? parseInt(form.power) : undefined,
        audience:   form.audience || undefined,
      });
      toast.success('✅ Сторінку згенеровано!');
      router.push(`/pages/${res.data.id}/edit?projectId=${projectId}`);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message ?? 'Помилка генерації';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setCreating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const steps: Step[] = ['template', 'params'];
  const stepIdx = steps.indexOf(step);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-text3 mb-6">
        <span className="hover:text-text cursor-pointer" onClick={() => router.push('/pages')}>
          Сторінки
        </span>
        <ChevronRight size={12} />
        <span className="text-text">Нова сторінка</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { key: 'template', label: 'Шаблон' },
          { key: 'params',   label: 'Параметри' },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
              stepIdx >= i
                ? 'bg-accent text-black'
                : 'bg-surface2 text-text3'
            )}>{i + 1}</div>
            <span className={cn('text-[13px]', stepIdx >= i ? 'text-text' : 'text-text3')}>
              {s.label}
            </span>
            {i < 1 && <ChevronRight size={12} className="text-text3" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <Card className="mb-5">
        <CardBody>
          {step === 'template' && <StepTemplate />}
          {step === 'params'   && <StepParams />}
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (step === 'template') router.push('/pages');
            else setStep('template');
          }}
        >
          <ChevronLeft size={14} /> {step === 'template' ? 'Скасувати' : 'Назад'}
        </Button>

        {step === 'template' ? (
          <Button
            variant="primary"
            onClick={() => setStep('params')}
            disabled={!selected}
          >
            Далі <ChevronRight size={14} />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={creating}
          >
            <Zap size={14} /> Згенерувати сторінку
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NewPagePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPageContent />
    </Suspense>
  );
}
