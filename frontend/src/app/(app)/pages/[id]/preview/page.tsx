'use client';

import { Button, Spinner } from '@/components/ui';
import { pagesService } from '@/services/pages.service';
import { ArrowLeft, Edit3, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function PreviewContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const DEVICE_W = { desktop: '100%', tablet: '768px', mobile: '390px' };

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pagesService.preview(projectId, params.id);
      setHtml(res.data.html);
    } catch {
      setHtml('<html><body style="font-family:sans-serif;padding:40px;color:#666"><h2>Preview недоступний</h2><p>Сторінку ще не згенеровано або сталася помилка.</p></body></html>');
    } finally {
      setLoading(false);
    }
  }, [projectId, params.id]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Preview toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-text2 hover:text-text transition-colors"
        >
          <ArrowLeft size={14} /> Назад
        </button>

        <div className="flex-1" />

        {/* Device switcher */}
        <div className="flex items-center gap-1 bg-surface2 rounded-sm p-0.5">
          {(['desktop', 'tablet', 'mobile'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-3 py-1 text-[12px] rounded-[4px] transition-colors ${device === d
                ? 'bg-surface text-text shadow-sm'
                : 'text-text2 hover:text-text'
                }`}
            >
              {d === 'desktop' ? '🖥' : d === 'tablet' ? '📱' : '📲'}
              <span className="ml-1.5 hidden sm:inline capitalize">{d}</span>
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={loadPreview} loading={loading}>
          <RefreshCw size={12} /> Оновити
        </Button>

        <Button
          variant="ghost" size="sm"
          onClick={() => router.push(`/pages/${params.id}/edit?projectId=${projectId}`)}
        >
          <Edit3 size={12} /> Редагувати
        </Button>
      </div>

      {/* Preview frame */}
      <div className="flex-1 bg-surface3 overflow-auto flex justify-center p-4">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Spinner size={28} />
          </div>
        ) : (
          <div
            className="transition-all duration-300 bg-white shadow-lg rounded-sm overflow-hidden"
            style={{ width: DEVICE_W[device], maxWidth: '100%', minHeight: '600px' }}
          >
            <iframe
              srcDoc={html ?? ''}
              title="Page Preview"
              className="w-full border-none"
              style={{ minHeight: '600px', height: '100%' }}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-5 py-2 border-t border-border bg-surface text-[11px] text-text3 flex-shrink-0">
        <span>projectId: <span className="font-mono">{projectId}</span></span>
        <span>pageId: <span className="font-mono">{params.id}</span></span>
        <span>Пристрій: {device}</span>
      </div>
    </div>
  );
}

export default function PreviewPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreviewContent params={params} />
    </Suspense>
  );
}
