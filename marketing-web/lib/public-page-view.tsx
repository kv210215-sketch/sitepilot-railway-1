import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/BlockRenderer';
import type { PublicPageDto } from '@/lib/public-api';
import { getPublicPage } from '@/lib/public-cache';

type PublicPageViewProps = {
  path: string;
  /** When parent already fetched the page (shared with metadata / JSON-LD). */
  initialPage?: PublicPageDto | null;
};

export async function PublicPageView({ path, initialPage }: PublicPageViewProps) {
  const page = initialPage === undefined ? await getPublicPage(path) : initialPage;
  if (!page) {
    notFound();
  }

  return (
    <main>
      <BlockRenderer blocks={page.blocks} />
    </main>
  );
}
