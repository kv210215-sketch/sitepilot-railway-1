import { serializeJsonLd } from '@/lib/seo/schema';

type JsonLdProps = {
  data: Record<string, unknown> | null;
};

export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
