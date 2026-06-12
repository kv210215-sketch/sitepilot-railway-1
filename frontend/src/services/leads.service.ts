import { api } from '@/lib/api';

// Mirrors backend/src/modules/leads (LeadResponseDto / PaginatedLeadsDto).
export type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'converted' | 'archived' | 'spam';

export interface Lead {
  id:        string;
  projectId: string;
  pageId:    string | null;
  name:      string;
  email:     string | null;
  phone:     string | null;
  message:   string | null;
  pagePath:  string | null;
  source:    string;
  consent:   boolean;
  status:    LeadStatus;
  metadata:  Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedLeads {
  data: Lead[]; total: number; page: number; limit: number; totalPages: number;
}

export const leadsService = {
  list: (projectId: string, params?: Record<string, unknown>) =>
    api.get<PaginatedLeads>(`/projects/${projectId}/leads`, { params }),

  get:  (projectId: string, leadId: string) =>
    api.get<Lead>(`/projects/${projectId}/leads/${leadId}`),
};
