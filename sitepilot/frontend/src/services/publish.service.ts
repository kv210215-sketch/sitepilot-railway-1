import { api } from '@/lib/api';

export type PublishScope  = 'page' | 'project' | 'selected';
export type PublishStatus = 'pending' | 'queued' | 'processing' | 'success' | 'failed' | 'cancelled' | 'retrying';

export interface PublishJob {
  id:            string;
  projectId:     string;
  scope:         PublishScope;
  status:        PublishStatus;
  pagesTotal:    number;
  pagesSuccess:  number;
  pagesFailed:   number;
  attempt:       number;
  maxAttempts:   number;
  priority:      number;
  durationMs:    number | null;
  errorMessage:  string | null;
  startedAt:     string | null;
  completedAt:   string | null;
  queuedAt:      string;
  createdAt:     string;
  initiatorName?: string;
}

export interface PublishJobLog {
  id:         string;
  jobId:      string;
  level:      'info' | 'warn' | 'error';
  message:    string;
  context:    Record<string, unknown>;
  durationMs: number | null;
  createdAt:  string;
}

export interface PublishStats {
  total:         number;
  statusCounts:  Record<string, number>;
  avgDurationMs: number;
  successRate:   number;
  activeJobs:    number;
}

const base = (projectId: string) => `/projects/${projectId}/publish`;

export const publishService = {
  list:   (projectId: string, params?: Record<string, unknown>) =>
    api.get<{ data: PublishJob[]; total: number; page: number; limit: number; totalPages: number }>(
      base(projectId), { params }
    ),

  stats:  (projectId: string) =>
    api.get<PublishStats>(`${base(projectId)}/stats`),

  getOne: (projectId: string, jobId: string) =>
    api.get<PublishJob>(`${base(projectId)}/${jobId}`),

  getLogs: (projectId: string, jobId: string) =>
    api.get<PublishJobLog[]>(`${base(projectId)}/${jobId}/logs`),

  create: (projectId: string, dto: { scope: PublishScope; pageIds?: string[]; priority?: number }) =>
    api.post<PublishJob>(base(projectId), dto),

  retry:  (projectId: string, jobId: string) =>
    api.post<PublishJob>(`${base(projectId)}/${jobId}/retry`),

  cancel: (projectId: string, jobId: string) =>
    api.patch<PublishJob>(`${base(projectId)}/${jobId}/cancel`),
};

// ── Activity service ──────────────────────────────────────────────────────────

export interface ActivityItem {
  id:         string;
  action:     string;
  entityType: string | null;
  entityId:   string | null;
  entityName: string | null;
  changes:    Record<string, unknown>;
  createdAt:  string;
  userName:   string;
  userEmail?: string;
}

export const activityService = {
  list: (projectId: string, params?: Record<string, unknown>) =>
    api.get<{ data: ActivityItem[]; total: number; page: number; limit: number; totalPages: number }>(
      `/projects/${projectId}/activity`, { params }
    ),
};
