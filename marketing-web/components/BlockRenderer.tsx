import type { PublicPageBlock } from '@/lib/public-api';
import LeadForm, { type LeadFormField } from './LeadForm';
import RoiCalculator from './RoiCalculator';

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

type LeadTarget = { projectId?: string; pageId?: string };

function BlockSection({ block, projectId, pageId }: { block: PublicPageBlock } & LeadTarget) {
  try {
    return <BlockSectionInner block={block} projectId={projectId} pageId={pageId} />;
  } catch {
    return <UnknownBlock type={String(block.type)} />;
  }
}

function BlockSectionInner({ block, projectId, pageId }: { block: PublicPageBlock } & LeadTarget) {
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

    case 'benefits': {
      // Value-proposition cards ({ title, text }). Same card style as cases/testimonials.
      const items = asArray<{ title?: string; text?: string }>(d.items);
      if (items.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-benefits">
          {d.title ? <h2>{asString(d.title)}</h2> : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {items.map((b, i) => (
              <article key={i} style={{ background: 'var(--mw-card-bg)', border: '1px solid var(--mw-card-border)', borderRadius: 'var(--mw-card-radius)', padding: 18 }}>
                {b.title ? <h3 style={{ margin: '0 0 6px' }}>{asString(b.title)}</h3> : null}
                {b.text ? <p style={{ margin: 0, color: 'var(--mw-fg-muted)' }}>{asString(b.text)}</p> : null}
              </article>
            ))}
          </div>
        </section>
      );
    }

    case 'process': {
      // Ordered workflow steps ({ step, title, text }). Mirrors the `steps` block.
      const steps = asArray<{ step?: number; title?: string; text?: string }>(d.steps);
      if (steps.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-process">
          <h2>{asString(d.title, 'Як ми працюємо')}</h2>
          <ol>
            {steps.map((s, i) => (
              <li key={i}>
                <h3>{asString(s.title)}</h3>
                <p>{asString(s.text)}</p>
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

    case 'trust':
    case 'trust_badges': {
      const items = asArray<{ value?: string; label?: string }>(d.items);
      if (items.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-trust">
          {d.title ? <h2>{asString(d.title)}</h2> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
            {items.map((b, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--mw-accent)' }}>{asString(b.value)}</div>
                <div style={{ fontSize: 13, color: 'var(--mw-fg-subtle)' }}>{asString(b.label)}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'testimonials': {
      const items = asArray<{ author?: string; role?: string; text?: string; rating?: number }>(d.items);
      if (items.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-testimonials">
          <h2>{asString(d.title, 'Відгуки клієнтів')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {items.map((t, i) => {
              const rating = typeof t.rating === 'number' ? Math.max(0, Math.min(5, Math.round(t.rating))) : 0;
              return (
                <figure key={i} style={{ margin: 0, background: 'var(--mw-card-bg)', border: '1px solid var(--mw-card-border)', borderRadius: 'var(--mw-card-radius)', padding: 18 }}>
                  {rating > 0 ? <div style={{ color: 'var(--mw-star)', letterSpacing: 2 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div> : null}
                  <blockquote style={{ margin: '8px 0', fontStyle: 'italic', color: 'var(--mw-fg-muted)' }}>{asString(t.text)}</blockquote>
                  <figcaption style={{ fontSize: 13, fontWeight: 600 }}>
                    {asString(t.author)}{t.role ? <span style={{ fontWeight: 400, color: 'var(--mw-fg-faint)' }}>, {asString(t.role)}</span> : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      );
    }

    case 'cases':
    case 'customer_cases': {
      const items = asArray<{ title?: string; location?: string; power?: string; result?: string }>(d.items);
      if (items.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-cases">
          <h2>{asString(d.title, 'Наші роботи')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {items.map((c, i) => (
              <article key={i} style={{ border: '1px solid var(--mw-card-border)', borderRadius: 'var(--mw-card-radius)', padding: 16 }}>
                <h3 style={{ margin: '0 0 6px' }}>{asString(c.title)}</h3>
                {c.location ? <p style={{ margin: 0, fontSize: 13, color: 'var(--mw-fg-faint)' }}>{asString(c.location)}</p> : null}
                {c.power ? <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{asString(c.power)}</p> : null}
                {c.result ? <p style={{ margin: '6px 0 0', color: 'var(--mw-accent)', fontWeight: 600 }}>{asString(c.result)}</p> : null}
              </article>
            ))}
          </div>
        </section>
      );
    }

    case 'links':
    case 'city_links': {
      const items = asArray<{ label?: string; href?: string }>(d.items);
      if (items.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-links">
          {d.title ? <h2>{asString(d.title)}</h2> : null}
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', listStyle: 'none', padding: 0 }}>
            {items.map((l, i) => (
              <li key={i}>
                {/* Plain anchors so internal links are crawlable in SSR HTML */}
                <a href={asString(l.href)} style={{ color: 'var(--mw-accent)', textDecoration: 'none' }}>
                  {asString(l.label)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case 'cta':
      return (
        <section className="block block-cta">
          <h2>{asString(d.title, 'Готові почати?')}</h2>
          {d.text ? <p>{asString(d.text)}</p> : null}
          <LeadForm
            buttonText={asString(d.button) || undefined}
            source={asString(d.source) || 'cta_block'}
            projectId={projectId}
            pageId={pageId}
          />
        </section>
      );

    case 'roi_calculator':
    case 'calculator':
    case 'roi':
      return (
        <section className="block block-roi-calculator">
          <RoiCalculator
            title={asString(d.title) || undefined}
            defaultBusinessType={d.businessType === 'business' ? 'business' : 'home'}
            projectId={projectId}
            pageId={pageId}
          />
        </section>
      );

    case 'lead_form':
    case 'form':
    case 'contact':
      return (
        <section className="block block-lead-form">
          <LeadForm
            title={asString(d.title) || undefined}
            subtitle={asString(d.subtitle) || undefined}
            buttonText={asString(d.button) || undefined}
            source={asString(d.source) || 'website_form'}
            projectId={projectId}
            pageId={pageId}
            fields={Array.isArray(d.fields) ? (d.fields as unknown as LeadFormField[]) : undefined}
            consentText={asString(d.consent) || undefined}
          />
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

    case 'contact_info': {
      const messengers = asArray<{ label?: string; href?: string }>(d.messengers);
      const phone = asString(d.phone);
      const telHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '';
      const email = asString(d.email);
      // Empty-guard: with no contact fields at all there is nothing to render.
      const hasAny =
        !!phone || !!email || !!d.address || !!d.hours || messengers.length > 0 || !!d.mapEmbed;
      if (!hasAny) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-contact-info">
          {d.title ? <h2>{asString(d.title)}</h2> : null}
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {phone ? <li>Телефон: <a href={telHref}>{phone}</a></li> : null}
            {email ? <li>Email: <a href={`mailto:${email}`}>{email}</a></li> : null}
            {d.address ? <li>Адреса: {asString(d.address)}</li> : null}
            {d.hours ? <li>Графік: {asString(d.hours)}</li> : null}
            {messengers.length ? (
              <li>
                {messengers.map((m, i) => (
                  <a key={i} href={asString(m.href)} style={{ marginRight: 12, color: 'var(--mw-accent)' }}>
                    {asString(m.label)}
                  </a>
                ))}
              </li>
            ) : null}
          </ul>
          {/* mapEmbed is trusted admin-only (CMS), same trust level as the `custom` block.
              TODO(security): in future, restrict to an allowlisted <iframe src> (e.g. Google
              Maps embed) instead of accepting arbitrary HTML. */}
          {d.mapEmbed ? (
            <div className="contact-map" dangerouslySetInnerHTML={{ __html: asString(d.mapEmbed) }} />
          ) : null}
        </section>
      );
    }

    case 'seo_text': {
      // Structured rich text — safe alternative to `custom` (no dangerouslySetInnerHTML).
      const paragraphs = asArray<string>(d.paragraphs);
      if (paragraphs.length === 0) return <UnknownBlock type={block.type} />;
      return (
        <section className="block block-seo-text">
          {d.title ? <h2>{asString(d.title)}</h2> : null}
          {paragraphs.map((p, i) => (
            <p key={i}>{asString(p)}</p>
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

export function BlockRenderer({
  blocks, projectId, pageId,
}: {
  blocks: PublicPageBlock[];
  projectId?: string;
  pageId?: string;
}) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const sorted = [...safeBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="blocks">
      {sorted.map((block, index) => (
        <BlockSection
          key={`${block.type}-${block.order}-${index}`}
          block={block}
          projectId={projectId}
          pageId={pageId}
        />
      ))}
    </div>
  );
}
