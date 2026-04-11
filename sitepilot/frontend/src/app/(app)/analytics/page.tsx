'use client';

export const dynamic = 'force-dynamic';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-surface2 border border-border flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-accent" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Аналітика</h1>
        <p className="text-text2 max-w-sm">
          Статистика публікацій, конверсій і трафіку по проєктах.
          Скоро доступно.
        </p>
      </div>
    </div>
  );
}
