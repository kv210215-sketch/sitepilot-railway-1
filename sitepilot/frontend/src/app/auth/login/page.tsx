'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const params             = useSearchParams();
  const redirect           = params.get('redirect') ?? '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.email)    e.email    = 'Введіть email';
    if (!form.password) e.password = 'Введіть пароль';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    await login(form, redirect);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-display font-black text-[18px] text-black">
            S
          </div>
          <span className="font-display font-bold text-[20px]">
            Site<span className="text-accent">Pilot</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-lg p-8">
          <h1 className="font-display font-bold text-[20px] mb-1.5">Вхід у систему</h1>
          <p className="text-[13px] text-text2 mb-6">
            Керуюча платформа solomiya-energy.com
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@solomiya-energy.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />
            <div>
              <Input
                label="Пароль"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-text2 hover:text-accent transition-colors"
                >
                  Забули пароль?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full justify-center mt-1 py-2.5"
            >
              Увійти
            </Button>
          </form>

          <p className="text-center text-[13px] text-text2 mt-5">
            Немає акаунту?{' '}
            <Link href="/auth/register" className="text-accent hover:underline font-medium">
              Зареєструватись
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-text3 mt-4">
          © {new Date().getFullYear()} SitePilot · Solomiya Energy
        </p>
      </div>
    </div>
  );
}
