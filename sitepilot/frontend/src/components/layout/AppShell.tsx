'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderOpen, FileText, Upload,
  Activity, LayoutTemplate, HardDrive, Users,
  BarChart3, Bell, Plus, ChevronDown,
} from 'lucide-react';
import { cn } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';

const NAV = [
  {
    label: 'Головне',
    items: [
      { href: '/dashboard',  icon: LayoutDashboard, label: 'Дашборд' },
      { href: '/projects',   icon: FolderOpen,      label: 'Проєкти',  badge: '3', badgeColor: 'green' },
      { href: '/pages',      icon: FileText,         label: 'Сторінки' },
    ],
  },
  {
    label: 'Публікація',
    items: [
      { href: '/publish',    icon: Upload,           label: 'Publish Queue', badge: '2' },
      { href: '/activity',   icon: Activity,         label: 'Активність' },
    ],
  },
  {
    label: 'Контент',
    items: [
      { href: '/templates',  icon: LayoutTemplate,   label: 'Шаблони' },
      { href: '/backups',    icon: HardDrive,         label: 'Бекапи' },
    ],
  },
  {
    label: 'Команда',
    items: [
      { href: '/team',       icon: Users,            label: 'Команда' },
      { href: '/analytics',  icon: BarChart3,        label: 'Аналітика' },
    ],
  },
];

function NavItem({
  href, icon: Icon, label, badge, badgeColor,
}: {
  href: string; icon: React.ElementType; label: string;
  badge?: string; badgeColor?: string;
}) {
  const pathname = usePathname();
  const active   = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[13.5px] font-medium transition-all relative',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-text2 hover:bg-surface2 hover:text-text',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-sm bg-accent" />
      )}
      <Icon size={15} className="flex-shrink-0 opacity-90" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          badgeColor === 'green'
            ? 'bg-success text-black'
            : 'bg-accent2 text-white',
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const user            = useAuthStore((s) => s.user);
  const { logout }      = useAuth();
  const [userOpen, setUserOpen] = useState(false);

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '??';

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[240px] flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-y-auto">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-[18px] pb-3.5 border-b border-border">
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-display font-black text-[15px] text-black flex-shrink-0">
            S
          </div>
          <span className="font-display font-bold text-[16px] tracking-tight">
            Site<span className="text-accent">Pilot</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          {NAV.map((section) => (
            <div key={section.label} className="mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-text3 px-2 pt-3 pb-1.5">
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm hover:bg-surface2 transition-colors text-left"
          >
            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-purple to-info flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text truncate">{user?.name}</p>
              <p className="text-[11px] text-accent font-medium">✦ Pro plan</p>
            </div>
            <ChevronDown size={12} className={cn('text-text3 transition-transform', userOpen && 'rotate-180')} />
          </button>

          {userOpen && (
            <div className="mt-1 bg-surface2 border border-border2 rounded-sm overflow-hidden">
              <Link
                href="/account"
                className="block px-3 py-2 text-[13px] text-text2 hover:text-text hover:bg-surface3 transition-colors"
              >
                Налаштування
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-[13px] text-danger hover:bg-surface3 transition-colors"
              >
                Вийти
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 flex items-center px-6 gap-4 border-b border-border bg-surface flex-shrink-0">
          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2 bg-surface2 border border-border2 rounded-sm px-3 py-1.5 w-52 focus-within:border-accent transition-colors">
            <svg className="w-3 h-3 text-text3 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="7" cy="7" r="5" /><path d="M12 12l2.5 2.5" />
            </svg>
            <input
              type="text"
              placeholder="Пошук..."
              className="bg-transparent border-none outline-none text-[13px] text-text placeholder:text-text3 w-full"
            />
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-accent text-black text-[13px] font-semibold rounded-sm hover:bg-[#ffc04a] transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            Новий проєкт
          </Link>

          <button className="w-8 h-8 flex items-center justify-center rounded-sm text-text2 hover:bg-surface2 hover:text-text transition-colors relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent2 rounded-full" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
