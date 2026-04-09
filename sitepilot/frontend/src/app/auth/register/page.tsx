'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name || form.name.trim().length < 2) e.name = "Мінімум 2 символи";
    if (!form.email || !form.email.includes('@'))  e.email = 'Невалідний email';
    if (form.password.length < 8)                  e.password = 'Мінімум 8 символів';
    if (form.password !== form.confirm)             e.confirm = 'Паролі не збігаються';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-display font-black text-[18px] text-black">S</div>
          <span className="font-display font-bold text-[20px]">Site<span className="text-accent">Pilot</span></span>
        </div>

        <div className="bg-surface border border-border rounded-lg p-8">
          <h1 className="font-display font-bold text-[20px] mb-1.5">Реєстрація</h1>
          <p className="text-[13px] text-text2 mb-6">Створіть акаунт SitePilot</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Ім'я"
              placeholder="Іван Петренко"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              autoFocus
            />
            <Input
              label="Email"
              type="email"
              placeholder="user@solomiya-energy.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="Мінімум 8 символів"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
            />
            <Input
              label="Підтвердити пароль"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              error={errors.confirm}
            />
            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center mt-1 py-2.5">
              Створити акаунт
            </Button>
          </form>

          <p className="text-center text-[13px] text-text2 mt-5">
            Вже є акаунт?{' '}
            <Link href="/auth/login" className="text-accent hover:underline font-medium">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
