'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { submitLead, leadErrorMessage } from '@/lib/leads';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/** A single configurable lead-form field, supplied by the page block data. */
export interface LeadFormField {
  name: string;
  label?: string;
  type?: 'text' | 'tel' | 'email' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

interface LeadFormProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  source?: string;
  /** Required for submission — supplied by the page DTO via BlockRenderer. */
  projectId?: string;
  pageId?: string;
  /** Dynamic fields from the page block; falls back to a default set when absent. */
  fields?: LeadFormField[];
  /** Consent text shown next to the required checkbox. */
  consentText?: string;
}

/** Backward-compatible default field set (used when a block supplies no `fields`). */
const DEFAULT_FIELDS: LeadFormField[] = [
  { name: 'name', label: "Ваше ім'я", type: 'text', required: true },
  { name: 'phone', label: 'Телефон', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'city', label: 'Місто', type: 'text' },
  { name: 'message', label: 'Коментар', type: 'textarea' },
];

const DEFAULT_CONSENT =
  'Даю згоду на обробку моїх персональних даних для звʼязку щодо консультації, ' +
  'підготовки пропозиції та опрацювання мого звернення.';

// Fields mapped to first-class lead columns; everything else goes into metadata.
const KNOWN = new Set(['name', 'phone', 'email', 'city', 'message']);

const AUTOCOMPLETE: Record<string, string> = {
  name: 'name', phone: 'tel', email: 'email', city: 'address-level2',
};

const wrap: CSSProperties = {
  maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12,
};
const field: CSSProperties = {
  padding: '12px 14px', fontSize: 16, border: '1px solid var(--mw-input-border)',
  borderRadius: 'var(--mw-input-radius)', width: '100%', boxSizing: 'border-box',
};
const button: CSSProperties = {
  padding: '14px 20px', fontSize: 16, fontWeight: 600, color: 'var(--mw-on-accent)',
  background: 'var(--mw-accent)', border: 'none', borderRadius: 'var(--mw-input-radius)', cursor: 'pointer',
};

function FieldInput({ f }: { f: LeadFormField }) {
  const ph = f.label ? f.label + (f.required ? ' *' : '') : f.name;
  const common = { name: f.name, style: field, 'aria-label': f.label || f.name } as const;
  if (f.type === 'textarea') {
    return <textarea {...common} style={{ ...field, minHeight: 90, resize: 'vertical' }} placeholder={ph} />;
  }
  if (f.type === 'select') {
    return (
      <select {...common} defaultValue="">
        <option value="" disabled>{f.label || 'Оберіть…'}</option>
        {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input
      {...common}
      type={f.type === 'tel' || f.type === 'email' ? f.type : 'text'}
      placeholder={ph}
      autoComplete={AUTOCOMPLETE[f.name] ?? 'on'}
      inputMode={f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : undefined}
      required={f.required}
    />
  );
}

export default function LeadForm({
  title = 'Отримати безкоштовну консультацію',
  subtitle = 'Залиште контакти — передзвонимо протягом 15 хвилин',
  buttonText = 'Отримати консультацію',
  source = 'website_form',
  projectId,
  pageId,
  fields,
  consentText,
}: LeadFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  // Honeypot — bots fill hidden fields; humans don't.
  const honeypot = useRef<HTMLInputElement>(null);

  const effectiveFields = fields && fields.length > 0 ? fields : DEFAULT_FIELDS;
  const consentLabel = consentText || DEFAULT_CONSENT;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();

    if (name.length < 2) {
      setError("Вкажіть ваше ім'я");
      return;
    }
    if (!phone && !email) {
      setError('Вкажіть телефон або email');
      return;
    }
    if (!consent) {
      setError('Підтвердіть згоду на обробку персональних даних');
      return;
    }
    // Honeypot only: bots fill the hidden field; show success but never submit.
    if (honeypot.current?.value) {
      setStatus('success');
      return;
    }
    if (!projectId) {
      setError('Сервіс тимчасово недоступний');
      setStatus('error');
      return;
    }

    // Non-standard fields (e.g. objectType) go to metadata — no backend change needed.
    const meta: Record<string, unknown> = {};
    for (const f of effectiveFields) {
      if (KNOWN.has(f.name)) continue;
      const v = String(data.get(f.name) ?? '').trim();
      if (v) meta[f.name] = v;
    }

    setStatus('submitting');
    try {
      const result = await submitLead({
        projectId,
        pageId,
        name,
        phone,
        email,
        city: String(data.get('city') ?? '').trim() || undefined,
        message: String(data.get('message') ?? '').trim() || undefined,
        source,
        consent: true,
        website: honeypot.current?.value || undefined,
        meta: Object.keys(meta).length ? meta : undefined,
      });

      if (!result.ok) {
        setError(leadErrorMessage(result.status));
        setStatus('error');
        return;
      }

      form.reset();
      setConsent(false);
      setStatus('success');
    } catch {
      setError('Помилка мережі. Перевірте зʼєднання.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ ...wrap, textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <h3 style={{ margin: 0 }}>Дякуємо! Заявку отримано.</h3>
        <p style={{ margin: 0, color: 'var(--mw-fg-mute)' }}>
          Наш менеджер звʼяжеться з вами найближчим часом.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={wrap} noValidate>
      {title ? <h3 style={{ margin: 0, textAlign: 'center' }}>{title}</h3> : null}
      {subtitle ? (
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--mw-fg-mute)' }}>{subtitle}</p>
      ) : null}

      {effectiveFields.map((f) => <FieldInput key={f.name} f={f} />)}

      {/* Honeypot: visually hidden, off-screen, not announced to AT */}
      <input
        ref={honeypot}
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--mw-fg-mute)' }}>
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span>
          {consentLabel}{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mw-accent)' }}>
            Політика конфіденційності
          </a>
        </span>
      </label>

      {error ? <p style={{ color: 'var(--mw-danger)', margin: 0 }}>{error}</p> : null}

      <button
        type="submit"
        style={{ ...button, ...(consent ? {} : { opacity: 0.6, cursor: 'not-allowed' }) }}
        disabled={status === 'submitting' || !consent}
      >
        {status === 'submitting' ? 'Надсилання…' : buttonText}
      </button>
    </form>
  );
}
