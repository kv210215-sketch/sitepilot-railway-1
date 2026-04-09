'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { authService, LoginDto, RegisterDto } from '@/services/auth.service';

export function useAuth() {
  const router = useRouter();
  const { setAuth, logout: storeLogout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const login = async (dto: LoginDto, redirect = '/dashboard') => {
    setLoading(true);
    try {
      const { data } = await authService.login(dto);
      setAuth(data.user, data.tokens);

      // Persist token in httpOnly-like cookie via header (best-effort)
      document.cookie = `sitepilot-token=${data.tokens.accessToken}; path=/; max-age=${data.tokens.expiresIn}; SameSite=Strict`;

      toast.success(`Вітаємо, ${data.user.name}!`);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Помилка входу';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (dto: RegisterDto) => {
    setLoading(true);
    try {
      const { data } = await authService.register(dto);
      setAuth(data.user, data.tokens);
      document.cookie = `sitepilot-token=${data.tokens.accessToken}; path=/; max-age=${data.tokens.expiresIn}; SameSite=Strict`;
      toast.success('Акаунт створено!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Помилка реєстрації';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storeLogout();
    document.cookie = 'sitepilot-token=; path=/; max-age=0';
    router.push('/auth/login');
  };

  return { login, register, logout, loading };
}
