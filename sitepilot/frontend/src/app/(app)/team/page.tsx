'use client';

export const dynamic = 'force-dynamic';

import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-surface2 border border-border flex items-center justify-center">
        <Users className="w-8 h-8 text-accent" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Команда</h1>
        <p className="text-text2 max-w-sm">
          Управління членами команди та їх ролями у проєктах.
          Скоро доступно.
        </p>
      </div>
    </div>
  );
}
