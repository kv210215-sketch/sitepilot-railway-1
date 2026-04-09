import axios, {
  AxiosInstance, AxiosError, InternalAxiosRequestConfig,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Main API client ───────────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === 'undefined') return config;

  try {
    const raw = localStorage.getItem('sitepilot-auth');
    if (raw) {
      const state = JSON.parse(raw) as { state?: { tokens?: { accessToken?: string } } };
      const token = state?.state?.tokens?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch { /* ignore */ }

  return config;
});

// ── Response interceptor — 401 → refresh token → retry ───────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown)  => void;
}> = [];

function processQueue(err: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token!),
  );
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const raw = localStorage.getItem('sitepilot-auth');
      const state = raw
        ? (JSON.parse(raw) as { state?: { tokens?: { refreshToken?: string } } })
        : null;
      const refreshToken = state?.state?.tokens?.refreshToken;

      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post<{
        accessToken: string; refreshToken: string; expiresIn: number;
      }>(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });

      // Patch stored tokens
      if (state?.state) {
        state.state.tokens = data;
        localStorage.setItem('sitepilot-auth', JSON.stringify(state));
      }

      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem('sitepilot-auth');
      window.location.href = '/auth/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
