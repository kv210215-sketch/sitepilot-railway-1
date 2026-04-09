import api from '@/lib/api-client';

export type ProjectType   = 'landing' | 'multi_page' | 'catalog' | 'service_site' | 'solar_commercial';
export type ProjectStatus = 'active' | 'archived' | 'draft' | 'deleted';
export type UserRole      = 'owner' | 'manager' | 'editor' | 'technical' | 'viewer';

export interface Project {
  id: string; name: string; slug: string;
  domain: string | null; projectType: ProjectType; status: ProjectStatus;
  description: string | null; settings: Record<string, unknown>;
  seoDefaults: Record<string, unknown>; createdAt: string; updatedAt: string;
  pagesCount?: number; membersCount?: number;
}

export interface PaginatedProjects {
  data: Project[]; total: number; page: number; limit: number; totalPages: number;
}

export interface ProjectMember {
  id: string; userId: string; projectId: string; role: UserRole;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  createdAt: string;
}

export interface CreateProjectDto {
  name: string; slug?: string; domain?: string;
  projectType?: ProjectType; description?: string;
}

export const projectsService = {
  list:   (params?: Record<string, unknown>) =>
    api.get<PaginatedProjects>('/projects', { params }),

  get:    (id: string) =>
    api.get<Project>(`/projects/${id}`),

  create: (dto: CreateProjectDto) =>
    api.post<Project>('/projects', dto),

  update: (id: string, dto: Partial<CreateProjectDto & { status: ProjectStatus }>) =>
    api.patch<Project>(`/projects/${id}`, dto),

  archive: (id: string) =>
    api.patch<Project>(`/projects/${id}/archive`),

  remove:  (id: string) =>
    api.delete<{ message: string }>(`/projects/${id}`),

  // Members
  getMembers:       (id: string) =>
    api.get<ProjectMember[]>(`/projects/${id}/members`),

  addMember:        (id: string, userId: string, role: UserRole) =>
    api.post(`/projects/${id}/members`, { userId, role }),

  updateMemberRole: (id: string, memberId: string, role: UserRole) =>
    api.patch(`/projects/${id}/members/${memberId}/role`, { role }),

  removeMember:     (id: string, memberId: string) =>
    api.delete(`/projects/${id}/members/${memberId}`),
};
