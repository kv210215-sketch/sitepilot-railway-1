'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Globe, Archive, Trash2, Rocket } from 'lucide-react';
import {
  Button, Badge, Modal, Input, Select,
  Card, EmptyState, Spinner, cn,
} from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectStatus } from '@/services/projects.service';
import toast from 'react-hot-toast';
import { projectsService } from '@/services/projects.service';
import { publishService } from '@/services/publish.service';
import { organizationsService, Organization } from '@/services/organizations.service';

const TYPE_EMOJI: Record<string, string> = {
  landing: '🛬', multi_page: '📄', catalog: '📚',
  service_site: '⚡', solar_commercial: '☀️',
};

const STATUS_VARIANT: Record<ProjectStatus, 'active' | 'draft' | 'archived'> = {
  active: 'active', draft: 'draft', archived: 'archived', deleted: 'archived',
};

function ProjectCard({
  project, onRefetch,
}: {
  project: Project; onRefetch: () => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  // Project detail route does not exist yet — send the user to that project's
  // Pages screen (the fastest useful destination).
  const projectHref = `/pages?projectId=${project.id}`;

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPublishing(true);
    try {
      await publishService.create(project.id, { scope: 'project' });
      toast.success('🚀 Публікацію запущено!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Помилка запуску публікації'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      onClick={() => router.push(projectHref)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(projectHref); }}
      className="block bg-surface border border-border rounded-[10px] p-[18px] hover:border-border2 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,.3)] transition-all group cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3.5">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-[18px] flex-shrink-0">
          {TYPE_EMOJI[project.projectType] ?? '🌐'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[14px] mb-0.5 truncate">{project.name}</p>
          <p className="font-mono text-[12px] text-text3 truncate">{project.domain ?? `/${project.slug}`}</p>
        </div>
        <Badge variant={STATUS_VARIANT[project.status]}>
          {project.status}
        </Badge>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-[12px] text-text2 mb-3.5 line-clamp-2">{project.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 py-3.5 border-t border-border mb-3">
        {[
          { label: 'Сторінок',    value: project.pagesCount   ?? '—' },
          { label: 'Учасників',   value: project.membersCount ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="text-[12px] text-text2">
            <strong className="block font-display font-bold text-[16px] text-text">{value}</strong>
            {label}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost" size="sm" className="flex-1"
          onClick={() => router.push(projectHref)}
        >
          Редагувати
        </Button>
        <Button
          variant="primary" size="sm" className="flex-1"
          onClick={handlePublish}
          loading={publishing}
        >
          <Rocket size={12} />
          Publish
        </Button>
      </div>
    </div>
  );
}

function CreateProjectModal({
  open, onClose, onCreate,
}: {
  open: boolean; onClose: () => void; onCreate: () => void;
}) {
  const [form, setForm] = useState({ name: '', domain: '', projectType: 'service_site', description: '' });
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState('');
  const [orgsLoading, setOrgsLoading] = useState(false);

  // Resolve the user's organizations when the modal opens — the backend
  // requires organizationId on create, so we must attach one.
  useEffect(() => {
    if (!open) return;
    setOrgsLoading(true);
    organizationsService.list({ limit: 100 })
      .then((res) => {
        const list = res.data.data;
        setOrgs(list);
        setOrgId((prev) => prev || list[0]?.id || '');
      })
      .catch(() => toast.error('Не вдалося завантажити організації'))
      .finally(() => setOrgsLoading(false));
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Введіть назву проєкту"); return; }
    if (!orgId) { toast.error('Спочатку створіть організацію'); return; }
    setLoading(true);
    try {
      await projectsService.create({
        name: form.name.trim(),
        organizationId: orgId,
        domain: form.domain.trim() || undefined,
        projectType: form.projectType as Project['projectType'],
        description: form.description.trim() || undefined,
      });
      toast.success('✅ Проєкт створено!');
      setForm({ name: '', domain: '', projectType: 'service_site', description: '' });
      onCreate();
      onClose();
    } catch (err: unknown) {
      const msg = (err as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Помилка';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новий проєкт"
      icon="🗂"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Скасувати</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading || orgsLoading}>
            Створити проєкт
          </Button>
        </>
      }
    >
      {orgs.length > 1 && (
        <Select
          label="Організація"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
        >
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </Select>
      )}
      <Input
        label="Назва проєкту"
        placeholder="Solomiya Energy"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Домен"
        placeholder="www.solomiya-energy.com"
        value={form.domain}
        onChange={(e) => setForm({ ...form, domain: e.target.value })}
      />
      <Select
        label="Тип проєкту"
        value={form.projectType}
        onChange={(e) => setForm({ ...form, projectType: e.target.value })}
      >
        <option value="service_site">Service Site</option>
        <option value="landing">Landing</option>
        <option value="multi_page">Multi-page</option>
        <option value="catalog">Catalog</option>
        <option value="solar_commercial">Solar Commercial</option>
      </Select>
      <Input
        label="Опис (необов'язково)"
        placeholder="Короткий опис проєкту"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </Modal>
  );
}

export default function ProjectsPage() {
  const [modalOpen,   setModalOpen]   = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');

  const { data, loading, refetch } = useProjects({
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter   && { projectType: typeFilter }),
  });

  const projects = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display font-bold text-[17px] flex-1">Проєкти</h1>
        {data && (
          <span className="text-[12px] text-text3 bg-surface2 px-2 py-0.5 rounded-full">
            {data.total} проєктів
          </span>
        )}

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto text-[12px] py-1.5"
        >
          <option value="">Всі статуси</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-auto text-[12px] py-1.5"
        >
          <option value="">Всі типи</option>
          <option value="service_site">Service Site</option>
          <option value="landing">Landing</option>
          <option value="multi_page">Multi-page</option>
          <option value="catalog">Catalog</option>
          <option value="solar_commercial">Solar Commercial</option>
        </Select>

        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={13} strokeWidth={2.5} />
          Новий проєкт
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size={24} />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗂"
            title="Проєктів ще немає"
            description="Створіть перший проєкт для solomiya-energy.com"
            action={
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                <Plus size={13} />
                Створити проєкт
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onRefetch={refetch} />
          ))}

          {/* New project card */}
          <button
            onClick={() => setModalOpen(true)}
            className="border border-dashed border-border rounded-[10px] p-[18px] flex flex-col items-center justify-center gap-2 opacity-50 hover:opacity-70 hover:border-border2 transition-all cursor-pointer min-h-[200px]"
          >
            <Plus size={28} className="text-text2" />
            <span className="font-display font-bold text-[14px] text-text2">Новий проєкт</span>
            <span className="text-[12px] text-text3">Ліміт плану: 15</span>
          </button>
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={refetch}
      />
    </div>
  );
}
