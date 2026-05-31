'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Input, Select, Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { projectsService } from '@/services/projects.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
}

interface PaginatedOrganizations {
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function NewProjectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    organizationId: '',
    slug: '',
    domain: '',
    description: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<PaginatedOrganizations>('/organizations', {
          params: { page: 1, limit: 100 },
        });
        if (!active) return;
        const list = res.data.data ?? [];
        setOrgs(list);
        setForm((f) => ({ ...f, organizationId: list[0]?.id ?? '' }));
      } catch {
        if (active) toast.error('Не вдалося завантажити організації');
      } finally {
        if (active) setOrgsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Введіть назву проєкту');
      return;
    }
    setSubmitting(true);
    try {
      // No organization yet → auto-create a default workspace, then use it.
      let organizationId = form.organizationId;
      if (!organizationId) {
        const fallbackOrgName = `${(user?.name ?? 'My').trim()} Workspace`;
        const createdOrg = await api.post<{ id: string }>('/organizations', {
          name: fallbackOrgName,
        });
        organizationId = createdOrg.data.id;
      }

      await projectsService.create({
        name: form.name.trim(),
        organizationId,
        slug: form.slug.trim() || undefined,
        domain: form.domain.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      toast.success('✅ Проєкт створено!');
      router.push('/projects');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Помилка';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/projects"
          className="text-text2 hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display font-bold text-[17px]">Новий проєкт</h1>
      </div>

      <Card>
        {orgsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner size={24} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Назва проєкту"
              placeholder="Solomiya Energy"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Select
              label="Організація"
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
            >
              {orgs.length === 0 && (
                <option value="">Робочий простір буде створено автоматично</option>
              )}
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>

            <Input
              label="Slug (необов'язково)"
              placeholder="solomiya-energy"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />

            <Input
              label="Домен (необов'язково)"
              placeholder="www.solomiya-energy.com"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            />

            <Input
              label="Опис (необов'язково)"
              placeholder="Короткий опис проєкту"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="flex gap-2 pt-2">
              <Link href="/projects" className="flex-1">
                <Button type="button" variant="ghost" className="w-full">
                  Скасувати
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={submitting}
              >
                Створити проєкт
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
