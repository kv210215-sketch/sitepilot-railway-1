'use client';

export const dynamic = 'force-dynamic';

import { api } from '@/lib/api';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin, Phone,
  Rocket,
  Sparkles,
  Sun,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Step = 'welcome' | 'type' | 'goal' | 'data' | 'generate' | 'publish' | 'done';

interface Session { id: string; step: Step; payload?: Record<string, unknown> }

const BUSINESS_TYPES = [
  { value: 'solar', label: 'СЕС / Енергетика', icon: Sun, desc: 'Сонячні панелі, інвертори, монтаж' },
  { value: 'services', label: 'Послуги', icon: Briefcase, desc: 'Будь-яка сфера послуг' },
  { value: 'other', label: 'Інше', icon: Building2, desc: 'Інший тип бізнесу' },
];

const GOALS = [
  { value: 'leads', label: 'Отримати ліди', icon: Target, desc: 'Збирати заявки від клієнтів' },
  { value: 'sales', label: 'Прямі продажі', icon: Zap, desc: 'Продавати онлайн напряму' },
  { value: 'reserve', label: 'Резерв / Довіра', icon: Users, desc: 'Підкріпити бізнес в мережі' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', city: '', phone: '', email: '' });
  const [genPayload, setGenPayload] = useState<Record<string, unknown> | null>(null);

  const post = async (path: string, body: object) => {
    const { data } = await api.post(path, body);
    return data;
  };

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleStart = async () => {
    setLoading(true); setError('');
    try {
      const data = await post('/onboarding/start', {});
      setSession({ id: data.sessionId, step: 'type' });
      setStep('type');
    } catch { setError('Помилка з\'єднання. Перевірте інтернет.'); }
    setLoading(false);
  };

  const handleType = async (type: string) => {
    if (!session) return;
    setLoading(true); setError('');
    try {
      await post('/onboarding/type', { sessionId: session.id, type });
      setStep('goal');
    } catch { setError('Помилка. Спробуйте ще раз.'); }
    setLoading(false);
  };

  const handleGoal = async (goal: string) => {
    if (!session) return;
    setLoading(true); setError('');
    try {
      await post('/onboarding/goal', { sessionId: session.id, goal });
      setStep('data');
    } catch { setError('Помилка. Спробуйте ще раз.'); }
    setLoading(false);
  };

  const handleData = async () => {
    if (!session || !form.name || !form.city) return;
    setLoading(true); setError('');
    try {
      await post('/onboarding/data', { sessionId: session.id, ...form });
      setStep('generate');
      // auto-trigger generation
      const genData = await post('/onboarding/generate', { sessionId: session.id });
      setGenPayload(genData.payload ?? null);
      setStep('publish');
    } catch { setError('Помилка генерації. Спробуйте ще раз.'); }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!session) return;
    setLoading(true); setError('');
    try {
      await post('/onboarding/publish', { sessionId: session.id });
      setStep('done');
    } catch { setError('Помилка публікації.'); }
    setLoading(false);
  };

  // ── Progress bar ──────────────────────────────────────────────────────────

  const steps: Step[] = ['welcome', 'type', 'goal', 'data', 'generate', 'publish', 'done'];
  const progress = Math.round((steps.indexOf(step) / (steps.length - 1)) * 100);

  return (
    <div className="max-w-lg mx-auto py-8 px-4">

      {/* Progress */}
      {step !== 'welcome' && step !== 'done' && (
        <div className="mb-8">
          <div className="flex justify-between text-[11px] text-text2 mb-2">
            <span>Крок {steps.indexOf(step)} з {steps.length - 2}</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-surface3 rounded-full h-1.5">
            <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-[13px] text-danger">
          {error}
        </div>
      )}

      {/* ── Welcome ──────────────────────────────────────────────────── */}
      {step === 'welcome' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Запустіть свій сайт</h1>
          <p className="text-text2 mb-8 max-w-sm mx-auto">
            Зберемо систему, яка приводить заявки за кілька хвилин. AI генерує сайт, форми і чат автоматично.
          </p>
          <button
            onClick={handleStart}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold rounded-full hover:bg-[#ffc04a] transition-colors text-[15px] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Почати
          </button>
        </div>
      )}

      {/* ── Type ─────────────────────────────────────────────────────── */}
      {step === 'type' && (
        <div>
          <h2 className="text-xl font-bold text-text mb-1">Тип бізнесу</h2>
          <p className="text-text2 text-[13px] mb-6">Оберіть, що найближче описує ваш бізнес</p>
          <div className="flex flex-col gap-3">
            {BUSINESS_TYPES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => handleType(value)}
                disabled={loading}
                className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-surface2 border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                  <Icon size={18} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-text">{label}</p>
                  <p className="text-[12px] text-text2">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Goal ─────────────────────────────────────────────────────── */}
      {step === 'goal' && (
        <div>
          <h2 className="text-xl font-bold text-text mb-1">Ціль сайту</h2>
          <p className="text-text2 text-[13px] mb-6">Що є головним результатом для вас?</p>
          <div className="flex flex-col gap-3">
            {GOALS.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => handleGoal(value)}
                disabled={loading}
                className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-surface2 border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                  <Icon size={18} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-text">{label}</p>
                  <p className="text-[12px] text-text2">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Data ─────────────────────────────────────────────────────── */}
      {step === 'data' && (
        <div>
          <h2 className="text-xl font-bold text-text mb-1">Дані про бізнес</h2>
          <p className="text-text2 text-[13px] mb-6">AI використає їх для генерації сайту</p>
          <div className="flex flex-col gap-4">
            {[
              { key: 'name', label: 'Назва компанії', icon: Building2, placeholder: 'Solomiya Energy', required: true },
              { key: 'city', label: 'Місто', icon: MapPin, placeholder: 'Київ', required: true },
              { key: 'phone', label: 'Телефон', icon: Phone, placeholder: '+380 50 123 4567', required: false },
              { key: 'email', label: 'Email', icon: Mail, placeholder: 'info@company.ua', required: false },
            ].map(({ key, label, icon: Icon, placeholder, required }) => (
              <div key={key}>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-text2 mb-1.5 flex items-center gap-1.5">
                  <Icon size={11} />
                  {label} {required && <span className="text-accent">*</span>}
                </label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-surface2 border border-border2 rounded-lg px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent transition-colors placeholder:text-text3"
                />
              </div>
            ))}
            <button
              onClick={handleData}
              disabled={loading || !form.name || !form.city}
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-accent text-black font-bold rounded-full hover:bg-[#ffc04a] transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Згенерувати сайт
            </button>
          </div>
        </div>
      )}

      {/* ── Generate (loading) ───────────────────────────────────────── */}
      {step === 'generate' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">AI генерує ваш сайт…</h2>
          <p className="text-text2 text-[13px]">Hero, CTA, FAQ, форма — все автоматично</p>
        </div>
      )}

      {/* ── Publish ──────────────────────────────────────────────────── */}
      {step === 'publish' && genPayload && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle2 className="text-success w-6 h-6 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-text">Сайт згенерований!</h2>
              <p className="text-text2 text-[13px]">AI підготував {String(genPayload.pageCount)} сторінок</p>
            </div>
          </div>

          <div className="bg-surface2 border border-border rounded-xl p-4 mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text3 mb-2">Структура сайту</p>
            {((genPayload.sections as string[]) ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                <span className="text-[13px] text-text">{s}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-black font-bold rounded-full hover:bg-[#ffc04a] transition-colors disabled:opacity-40 text-[15px]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            Опублікувати
          </button>
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Сайт готовий! 🎉</h1>
          <p className="text-text2 mb-8">Все підготовлено. Запустіть AI чат або підключіть рекламу.</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Запустити AI чат', icon: Sun, href: '/dashboard' },
              { label: 'Підключити рекламу', icon: Target, href: '/analytics' },
              { label: 'Перейти на дашборд', icon: Rocket, href: '/dashboard' },
            ].map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="flex items-center gap-3 px-5 py-3 bg-surface border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left"
              >
                <Icon size={16} className="text-accent flex-shrink-0" />
                <span className="text-[13px] font-medium text-text">{label}</span>
                <ArrowRight size={13} className="ml-auto text-text3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
