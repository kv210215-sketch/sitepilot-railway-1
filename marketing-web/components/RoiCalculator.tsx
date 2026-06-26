'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { computeRoi, formatUah, type BusinessType, type RoiResult } from '@/lib/solar-roi';
import { submitLead, leadErrorMessage } from '@/lib/leads';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const card: CSSProperties = {
  maxWidth: 560,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};
const field: CSSProperties = {
  padding: '12px 14px',
  fontSize: 16,
  border: '1px solid #ccd',
  borderRadius: 8,
  width: '100%',
  boxSizing: 'border-box',
};
const label: CSSProperties = { fontSize: 14, fontWeight: 600, marginBottom: 4, display: 'block' };
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
const resultBox: CSSProperties = {
  background: '#f1f9f4',
  border: '1px solid #bfe3cd',
  borderRadius: 10,
  padding: 18,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};
const metric: CSSProperties = { display: 'flex', flexDirection: 'column' };
const metricValue: CSSProperties = { fontSize: 22, fontWeight: 700, color: '#0a6b3b' };
const metricLabel: CSSProperties = { fontSize: 13, color: '#557' };

export default function RoiCalculator({
  title = 'Калькулятор економії на сонячній станції',
  defaultBusinessType = 'home',
  projectId,
  pageId,
}: {
  title?: string;
  defaultBusinessType?: BusinessType;
  projectId?: string;
  pageId?: string;
}) {
  const [monthlyBill, setMonthlyBill] = useState('');
  const [monthlyConsumption, setMonthlyConsumption] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>(defaultBusinessType);
  const [calculated, setCalculated] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const result: RoiResult | null = useMemo(() => {
    if (!calculated) return null;
    return computeRoi({
      monthlyBill: Number(monthlyBill),
      monthlyConsumption: monthlyConsumption ? Number(monthlyConsumption) : undefined,
      businessType,
    });
  }, [calculated, monthlyBill, monthlyConsumption, businessType]);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!monthlyBill || Number(monthlyBill) <= 0) {
      setError('Вкажіть середній місячний рахунок за електроенергію');
      return;
    }
    setCalculated(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Вкажіть ваше імʼя");
      return;
    }
    if (!phone.trim()) {
      setError('Вкажіть номер телефону');
      return;
    }
    if (!projectId) {
      setError('Сервіс тимчасово недоступний');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      const res = await submitLead({
        projectId,
        pageId,
        name: name.trim(),
        phone: phone.trim(),
        source: 'calculator',
        consent: true,
        message: result
          ? `Розрахунок: ${result.systemSizeKw} кВт, економія ${formatUah(result.annualSavings)}/рік, окупність ${result.paybackYears} р.`
          : undefined,
        meta: {
          calculator: {
            monthlyBill: Number(monthlyBill),
            monthlyConsumption: monthlyConsumption ? Number(monthlyConsumption) : null,
            businessType,
            systemSizeKw: result?.systemSizeKw ?? null,
            annualSavings: result?.annualSavings ?? null,
            systemCost: result?.systemCost ?? null,
            paybackYears: result?.paybackYears ?? null,
            lifetimeSavings: result?.lifetimeSavings ?? null,
          },
        },
      });
      if (!res.ok) {
        setError(leadErrorMessage(res.status));
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setError('Помилка мережі. Перевірте зʼєднання.');
      setStatus('error');
    }
  }

  return (
    <div style={card}>
      <h3 style={{ margin: 0, textAlign: 'center' }}>{title}</h3>

      <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label} htmlFor="roi-bill">Місячний рахунок за світло, грн *</label>
          <input
            id="roi-bill" style={field} type="number" inputMode="numeric" min={0}
            placeholder="наприклад, 3500"
            value={monthlyBill} onChange={(e) => setMonthlyBill(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="roi-kwh">Споживання, кВт·год/міс (необовʼязково)</label>
          <input
            id="roi-kwh" style={field} type="number" inputMode="numeric" min={0}
            placeholder="якщо знаєте"
            value={monthlyConsumption} onChange={(e) => setMonthlyConsumption(e.target.value)}
          />
        </div>
        <div>
          <label style={label} htmlFor="roi-type">Тип обʼєкта</label>
          <select
            id="roi-type" style={field}
            value={businessType} onChange={(e) => setBusinessType(e.target.value as BusinessType)}
          >
            <option value="home">Дім / приватний будинок</option>
            <option value="business">Бізнес / комерція</option>
          </select>
        </div>
        <button type="submit" style={button}>Розрахувати</button>
      </form>

      {result ? (
        <>
          <div style={resultBox}>
            <div style={metric}>
              <span style={metricValue}>{result.systemSizeKw} кВт</span>
              <span style={metricLabel}>Рекомендована потужність</span>
            </div>
            <div style={metric}>
              <span style={metricValue}>{formatUah(result.annualSavings)}</span>
              <span style={metricLabel}>Економія на рік</span>
            </div>
            <div style={metric}>
              <span style={metricValue}>{result.paybackYears} р.</span>
              <span style={metricLabel}>Окупність</span>
            </div>
            <div style={metric}>
              <span style={metricValue}>{formatUah(result.lifetimeSavings)}</span>
              <span style={metricLabel}>Економія за 25 років</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: 0, textAlign: 'center' }}>
            Орієнтовний розрахунок. Точну пропозицію підготуємо після консультації.
          </p>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 36 }}>✅</div>
              <h4 style={{ margin: '8px 0' }}>Дякуємо! Заявку отримано.</h4>
              <p style={{ margin: 0, color: '#555' }}>
                Менеджер підготує детальний розрахунок і звʼяжеться з вами.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                style={field} placeholder="Ваше імʼя *" autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)}
              />
              <input
                style={field} type="tel" inputMode="tel" placeholder="Телефон *" autoComplete="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
              {error ? <p style={{ color: '#c00', margin: 0 }}>{error}</p> : null}
              <button type="submit" style={button} disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Надсилання…' : 'Отримати безкоштовний розрахунок'}
              </button>
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', margin: 0 }}>
                Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних.
              </p>
            </form>
          )}
        </>
      ) : (
        error ? <p style={{ color: '#c00', margin: 0, textAlign: 'center' }}>{error}</p> : null
      )}
    </div>
  );
}
