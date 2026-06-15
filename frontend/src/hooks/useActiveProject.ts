'use client';

import { useSearchParams } from 'next/navigation';
import { useProjects } from './useProjects';

// ── useActiveProject ────────────────────────────────────────────────────────
// Resolves the project id for project-scoped screens.
//
// Priority: ?projectId= in the URL → first project the user actually has.
// Replaces the old `process.env.NEXT_PUBLIC_DEFAULT_PROJECT ?? ''` fallback:
// that build-time var is never injected into the bundle, so it was always ''
// on deployed builds and every project-scoped request fired at `/projects//…`,
// which the backend rejects with 400 (uuid expected) — breaking create page,
// AI generate and publish while non-scoped flows (login/dashboard/leads) worked.

export function useActiveProject(): {
  projectId: string;
  loading: boolean;
  hasProject: boolean;
} {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('projectId');
  const { data, loading } = useProjects();

  const projectId = fromUrl || data?.data?.[0]?.id || '';

  return {
    projectId,
    loading: fromUrl ? false : loading,
    hasProject: Boolean(projectId),
  };
}
