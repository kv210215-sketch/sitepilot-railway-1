'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { projectsService, Project, PaginatedProjects, CreateProjectDto } from '@/services/projects.service';

export function useProjects(params?: Record<string, unknown>) {
  const [data,    setData]    = useState<PaginatedProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectsService.list(params);
      setData(res.data);
      setError(null);
    } catch {
      setError('Не вдалося завантажити проєкти');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  const createProject = async (dto: CreateProjectDto): Promise<Project | null> => {
    try {
      const res = await projectsService.create(dto);
      toast.success('Проєкт створено!');
      await fetch();
      return res.data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Помилка створення';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
      return null;
    }
  };

  const archiveProject = async (id: string) => {
    try {
      await projectsService.archive(id);
      toast.success('Проєкт архівовано');
      await fetch();
    } catch {
      toast.error('Помилка архівування');
    }
  };

  const removeProject = async (id: string) => {
    try {
      await projectsService.remove(id);
      toast.success('Проєкт видалено');
      await fetch();
    } catch {
      toast.error('Помилка видалення');
    }
  };

  return { data, loading, error, refetch: fetch, createProject, archiveProject, removeProject };
}
