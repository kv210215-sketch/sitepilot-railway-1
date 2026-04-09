'use client';

import { clsx } from 'clsx';
import { Loader2, X } from 'lucide-react';
import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, useEffect } from 'react';

// ── cn helper ─────────────────────────────────────────────────────────────────
export function cn(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'ghost', size = 'md', loading, children, className, disabled, ...rest
}: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 font-semibold transition-all rounded-sm cursor-pointer border-0';

  const variants = {
    primary: 'bg-accent text-black hover:bg-[#ffc04a]',
    ghost:   'border border-border2 text-text2 hover:border-text2 hover:text-text bg-transparent',
    danger:  'border border-red-500/30 text-danger bg-danger/5 hover:bg-danger/15',
    icon:    'text-text2 hover:bg-surface2 hover:text-text p-1.5',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-[13px] px-3.5 py-[7px]',
  };

  return (
    <button
      {...rest}
      disabled={disabled ?? loading}
      className={cn(base, variants[variant], variant !== 'icon' && sizes[size], className)}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'active' | 'draft' | 'archived' | 'queued' | 'processing' | 'success' | 'failed';

const badgeStyles: Record<BadgeVariant, string> = {
  active:     'bg-success/10 text-success',
  draft:      'bg-text2/10 text-text2',
  archived:   'bg-info/10 text-info',
  queued:     'bg-purple/10 text-purple',
  processing: 'bg-accent/10 text-accent animate-pulse',
  success:    'bg-success/10 text-success',
  failed:     'bg-danger/10 text-danger',
};

export function Badge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
      badgeStyles[variant],
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full flex-shrink-0',
        badgeStyles[variant].replace('bg-', 'bg-').split(' ')[0]
          .replace('/10', ''),
      )} />
      {children}
    </span>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-[0.4px] text-text2">
          {label}
        </label>
      )}
      <input
        {...rest}
        className={cn(
          'bg-surface2 border border-border2 rounded-sm px-3 py-2.5 text-[13.5px] text-text outline-none',
          'placeholder:text-text3 transition-colors focus:border-accent',
          error && 'border-danger',
          className,
        )}
      />
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, children, className, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-[0.4px] text-text2">
          {label}
        </label>
      )}
      <select
        {...rest}
        className={cn(
          'bg-surface2 border border-border2 rounded-sm px-3 py-2.5 text-[13.5px] text-text outline-none',
          'transition-colors focus:border-accent cursor-pointer',
          className,
        )}
      >
        {children}
      </select>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 style={{ width: size, height: size }} className="animate-spin text-accent" />;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface border border-border rounded-[10px]', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-border">
      <h3 className="font-display font-bold text-[13.5px] flex-1">{title}</h3>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-[18px]', className)}>{children}</div>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, icon, children, footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-[3px] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border2 rounded-lg w-[480px] max-w-[calc(100vw-32px)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="font-display font-bold text-[16px] flex-1">{title}</h2>
          <button onClick={onClose} className="text-text3 hover:text-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">{children}</div>

        {footer && (
          <div className="px-6 pb-5 flex gap-2.5 justify-end">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({ value, color = 'accent' }: { value: number; color?: 'accent' | 'success' | 'info' | 'danger' }) {
  const colors = { accent: 'bg-accent', success: 'bg-success', info: 'bg-info', danger: 'bg-danger' };
  return (
    <div className="bg-surface3 rounded-full h-[5px] overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, description, action,
}: {
  icon: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-4xl mb-3 opacity-40">{icon}</div>
      <h3 className="font-display font-bold text-[15px] text-text mb-1.5">{title}</h3>
      {description && <p className="text-[13px] text-text2 max-w-[280px] mx-auto mb-4">{description}</p>}
      {action}
    </div>
  );
}
