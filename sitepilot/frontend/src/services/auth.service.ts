import api from '@/lib/api-client';

export interface LoginDto       { email: string; password: string; }
export interface RegisterDto    { email: string; password: string; name: string; }
export interface ForgotPassDto  { email: string; }
export interface ResetPassDto   { token: string; password: string; }

export interface AuthUser {
  id: string; email: string; name: string;
  avatarUrl: string | null; status: string; emailVerified: boolean; createdAt: string;
}
export interface AuthTokens {
  accessToken: string; refreshToken: string; expiresIn: number;
}
export interface AuthResponse { user: AuthUser; tokens: AuthTokens; }

export const authService = {
  login:          (dto: LoginDto)       => api.post<AuthResponse>('/auth/login', dto),
  register:       (dto: RegisterDto)    => api.post<AuthResponse>('/auth/register', dto),
  forgotPassword: (dto: ForgotPassDto)  => api.post<{ message: string }>('/auth/forgot-password', dto),
  resetPassword:  (dto: ResetPassDto)   => api.post<{ message: string }>('/auth/reset-password', dto),
  refresh:        (rt: string)          => api.post<AuthTokens>('/auth/refresh', { refreshToken: rt }),
  me:             ()                    => api.get<AuthUser>('/auth/me'),
};
