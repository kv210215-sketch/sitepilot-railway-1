import type { PublicPageBlock } from '@/lib/public-api';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function UnknownBlock({ type }: { type: string }) {
  return (
    <section className="block block-unknown" data-block-type={type}>
      <p>Блок: {type}</p>
    </section>
  );
}

function BlockSection({ block }: { block: PublicPageBlock }) {
  try {
    return <BlockSectionInner block={block} />;
  } catch {
    return <UnknownBlock type={String(block.type)} />;
  }
}

function BlockSectionInner({ block }: { block: PublicPageBlock }) {
  const d = block.data ?? {};

  switch (block.type) {
    case 'hero':
      return (
        <section className="block block-hero">
          <h1>{asString(d.title)}</h1>
          {d.subtitle ? <p>{asString(d.subtitle)}</p> : null}
          {d.cta ? <p><strong>{asString(d.cta)}</strong></p> : null}
        </section>
      );

    case 'pain': {
      const items = asArray<{ problem?: string; solution?: string }>(d.items);
      return (
        <section className="block block-pain">
          <h2>{asString(d.title, 'Наші рішення')}</h2>
          <ul>
            {items.map((item, i) => (
              <li key={i}>
                <span>{asString(item.problem)}</span>
                {' → '}
                <span>{asString(item.solution)}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case 'steps': {
      const items = asArray<{ title?: string; description?: string }>(d.items);
      return (
        <section className="block block-steps">
          <h2>{asString(d.title, 'Як це працює')}</h2>
          <ol>
            {items.map((step, i) => (
              <li key={i}>
                <h3>{asString(step.title)}</h3>
                <p>{asString(step.description)}</p>
              </li>
            ))}
          </ol>
        </section>
      );
    }

    case 'numbers': {
      const items = asArray<{ value?: string; label?: string }>(d.items);
      return (
        <section className="block block-numbers">
          <dl>
            {items.map((n, i) => (
              <div key={i}>
                <dt>{asString(n.value)}</dt>
                <dd>{asString(n.label)}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }

    case 'audience':
      return (
        <section className="block block-audience">
          <h2>Для кого</h2>
          {d.home ? <p>{asString(d.home)}</p> : null}
          {d.business ? <p>{asString(d.business)}</p> : null}
        </section>
      );

    case 'guarantees': {
      const items = asArray<string>(d.items);
      return (
        <section className="block block-guarantees">
          <h2>Наші гарантії</h2>
          <ul>
            {items.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>
      );
    }

    case 'offers': {
      const offer = (d.offer ?? {}) as Record<string, unknown>;
      const items = asArray<string>(offer.items);
      return (
        <section className="block block-offers">
          <h2>Спеціальна пропозиція</h2>
          <h3>{asString(offer.title)}</h3>
          <ul>
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          {offer.cta ? <p>{asString(offer.cta)}</p> : null}
        </section>
      );
    }

    case 'cta':
      return (
        <section className="block block-cta">
          <h2>{asString(d.title, 'Готові почати?')}</h2>
          {d.text ? <p>{asString(d.text)}</p> : null}
          {d.button ? <p><strong>{asString(d.button)}</strong></p> : null}
        </section>
      );

    case 'faq': {
      const items = asArray<{ question?: string; answer?: string }>(d.items);
      return (
        <section className="block block-faq">
          <h2>Часті питання</h2>
          {items.map((f, i) => (
            <article key={i}>
              <h3>{asString(f.question)}</h3>
              <p>{asString(f.answer)}</p>
            </article>
          ))}
        </section>
      );
    }

    case 'custom':
      return (
        <section className="block block-custom">
          {d.html ? (
            <div dangerouslySetInnerHTML={{ __html: asString(d.html) }} />
          ) : (
            <UnknownBlock type={block.type} />
          )}
        </section>
      );

    default:
      return <UnknownBlock type={String(block.type)} />;
  }
}

export function BlockRenderer({ blocks }: { blocks: PublicPageBlock[] }) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const sorted = [...safeBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="blocks">
      {sorted.map((block, index) => (
        <BlockSection key={`${block.type}-${block.order}-${index}`} block={block} />
      ))}
    </div>
  );
}
