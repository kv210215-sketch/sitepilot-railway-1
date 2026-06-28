import { readMarketingSeoConfig } from '@/lib/seo/site-config';

/**
 * Theme chrome (header + footer) for the Solomiya dark+gold theme.
 *
 * Rendered by app/layout.tsx ONLY when getSiteTheme() === 'solomiya', so the
 * default theme and every other tenant never get this markup. All styling lives
 * under [data-theme='solomiya'] in globals.css (classes below appear only here).
 *
 * Content is generic + env-driven (brand from NEXT_PUBLIC_SITE_NAME, optional
 * phone from NEXT_PUBLIC_SITE_PHONE) — no tenant data is hardcoded into shared code.
 */
function brandName(): string {
  return readMarketingSeoConfig().siteName || 'Solomiya Energy';
}

export function SiteHeader() {
  const brand = brandName();
  const phone = process.env.NEXT_PUBLIC_SITE_PHONE?.trim();
  const telHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null;
  return (
    <header className="mw-header">
      <a className="mw-brand" href="/">{brand}</a>
      <nav className="mw-nav">
        {phone && telHref ? <a className="mw-phone" href={telHref}>{phone}</a> : null}
        <a className="mw-cta" href="/contacts">Отримати розрахунок</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const brand = brandName();
  return (
    <footer className="mw-footer">
      <div className="mw-footer-brand">{brand}</div>
      <p className="mw-footer-tagline">
        Сонячні електростанції під ключ — проєктування, монтаж та сервіс.
      </p>
      <div className="mw-footer-bottom">
        <a href="/privacy">Політика конфіденційності</a>
        <span>© {brand}</span>
      </div>
    </footer>
  );
}
