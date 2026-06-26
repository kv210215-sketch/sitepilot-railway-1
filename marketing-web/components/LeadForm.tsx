'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { submitLead, leadErrorMessage } from '@/lib/leads';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface LeadFormProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  source?: string;
  /** Required for submission — supplied by the page DTO via BlockRenderer. */
  projectId?: string;
  pageId?: string;
}

const wrap: CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};
const field: CSSProperties = {
  padding: '12px 14px',
  fontSize: 16,
  border: '1px solid #ccd',
  borderRadius: 8,
  width: '100%',
  boxSizing: 'border-box',
};
const button: CSSProperties = {
  padding: '14px 20px',
  fontSize: 16,
  fontWeight: 600,
  color: '#fff',
  background: '#0a8f4e',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

export default function LeadForm({
  title = 'Отримати безкоштовну консультацію',
  subtitle = 'Залиште контакти — передзвонимо протягом 15 хвилин',
  buttonText = 'Отримати консультацію',
  source = 'website_form',
  projectId,
  pageId,
}: LeadFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  // Honeypot — bots fill hidden fields; humans don't.
  const honeypot = useRef<HTMLInputElement>(null);

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
    // Honeypot only: bots fill the hidden field; show success but never submit.
    // No timing heuristic — a fast/autofilled legitimate submit must NOT be dropped.
    if (honeypot.current?.value) {
      setStatus('success');
      return;
    }
    if (!projectId) {
      setError('Сервіс тимчасово недоступний');
      setStatus('error');
      return;
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
      });

      if (!result.ok) {
        setError(leadErrorMessage(result.status));
        setStatus('error');
        return;
      }

      form.reset();
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
        <p style={{ margin: 0, color: '#555' }}>
          Наш менеджер звʼяжеться з вами найближчим часом.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={wrap} noValidate>
      {title ? <h3 style={{ margin: 0, textAlign: 'center' }}>{title}</h3> : null}
      {subtitle ? (
        <p style={{ margin: 0, textAlign: 'center', color: '#555' }}>{subtitle}</p>
      ) : null}

      <input style={field} name="name" placeholder="Ваше імʼя *" autoComplete="name" required />
      <input style={field} name="phone" type="tel" placeholder="Телефон" autoComplete="tel" inputMode="tel" />
      <input style={field} name="email" type="email" placeholder="Email" autoComplete="email" inputMode="email" />
      <input style={field} name="city" placeholder="Місто" autoComplete="address-level2" />
      <textarea style={{ ...field, minHeight: 90, resize: 'vertical' }} name="message" placeholder="Коментар (необовʼязково)" />

      {/* Honeypot: visually hidden, off-screen, not announced to AT */}
      <input
        ref={honeypot}
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      {error ? <p style={{ color: '#c00', margin: 0 }}>{error}</p> : null}

      <button type="submit" style={button} disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Надсилання…' : buttonText}
      </button>
      <p style={{ fontSize: 12, color: '#888', textAlign: 'center', margin: 0 }}>
        Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.
      </p>
    </form>
  );
}
