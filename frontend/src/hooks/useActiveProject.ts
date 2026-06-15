'use client';

import { useProjects } from '@/hooks/useProjects';

/**
 * Resolves the project context for project-scoped screens (Pages, Publish, Activity)
 * and for building project-aware navigation links.
 *
 * Prefers an explicit id (e.g. `?projectId=` from the URL); otherwise falls back to
 * the first available project so these screens never render without context and get
 * stuck on an endless spinner.
 *
 * Returns `projectsLoading` so callers can keep showing a spinner while the project
 * list is still being fetched (avoids an empty-state flash before auto-select kicks in).
 */
export function useActiveProject(explicitId?: string) {
  const { data, loading } = useProjects();
  const firstId = data?.data?.[0]?.id ?? '';
  const projectId = explicitId || firstId;

  return {
    projectId,
    projectsLoading: loading,
    projects: data?.data ?? [],
  };
}
