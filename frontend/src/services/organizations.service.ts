import { api } from '@/lib/api';

export interface Organization {
  id: string; name: string; slug: string;
  description: string | null; isActive: boolean; ownerId: string;
  settings: Record<string, unknown>; createdAt: string; updatedAt: string;
}

export interface PaginatedOrganizations {
  data: Organization[]; total: number; page: number; limit: number; totalPages: number;
}

export const organizationsService = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedOrganizations>('/organizations', { params }),
};
