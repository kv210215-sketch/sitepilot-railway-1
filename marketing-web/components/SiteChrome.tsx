import { readMarketingSeoConfig } from '@/lib/seo/site-config';

/**
 * Theme chrome (header + footer) for the Solomiya dark+gold theme.
 *
 * Rendered by app/layout.tsx ONLY when getSiteTheme() === 'solomiya', so the
 * default theme and every other tenant never get this markup. All styling lives
 * under [data-theme='solomiya'] in globals.css (classes below appear only here).
 *
 * Structure + copy mirror the design source of truth 1:1:
 *   https://solomiya-energy-landing.pages.dev/  (nav + footer)
 *
 * Brand, phone and email are env-overridable (NEXT_PUBLIC_SITE_NAME / _PHONE /
 * _EMAIL); the defaults are Solomiya's real public values (from its own live
 * footer), since this component only ever renders for the Solomiya deployment.
 */
const DEFAULTS = {
  name: 'Solomiya Energy',
  phone: '+38 067 555 40 00',
  email: 'andriy555solar@gmail.com',
  legal: 'ТОВ «Соломія енергозбереження» · ЄДРПОУ 40446535',
};

function brandName(): string {
  return readMarketingSeoConfig().siteName || DEFAULTS.name;
}

/** Split "Solomiya Energy" → ["SOLOMIYA", "ENERGY"]; second word is gold. */
function brandParts(): { head: string; tail: string } {
  const [head, ...rest] = brandName().trim().split(/\s+/);
  return { head: head ?? DEFAULTS.name, tail: rest.join(' ') };
}

function phone(): string {
  return process.env.NEXT_PUBLIC_SITE_PHONE?.trim() || DEFAULTS.phone;
}

function telHref(p: string): string {
  return `tel:${p.replace(/[^+\d]/g, '')}`;
}

function BrandMark({ stacked = false }: { stacked?: boolean }) {
  const { head, tail } = brandParts();
  return (
    <a className={`mw-brand${stacked ? ' mw-brand-stacked' : ''}`} href="/">
      <span className="mw-brand-mark">SE</span>
      {stacked ? (
        <span className="mw-brand-stack">
          <span>{head}</span>
          <span className="mw-brand-energy">{tail || ''}<span className="mw-gold-dot">.</span></span>
        </span>
      ) : (
        <span className="mw-brand-name">
          {head} {tail ? <span className="mw-brand-energy">{tail}</span> : null}
        </span>
      )}
    </a>
  );
}

export function SiteHeader() {
  const p = phone();
  return (
    <header className="mw-header">
      <div className="mw-header-inner">
        <BrandMark />
        <nav className="mw-nav">
          <a className="mw-phone" href={telHref(p)}>{p}</a>
          <a className="mw-cta" href="/contacts">Отримати розрахунок</a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const p = phone();
  const email = process.env.NEXT_PUBLIC_SITE_EMAIL?.trim() || DEFAULTS.email;
  const legal = process.env.NEXT_PUBLIC_SITE_LEGAL?.trim() || DEFAULTS.legal;
  return (
    <footer className="mw-footer">
      <div className="mw-footer-inner">
        <div className="mw-foot-grid">
          <div className="mw-foot-col mw-foot-brandcol">
            <BrandMark stacked />
            <p className="mw-footer-tagline">
              Проєктуємо та монтуємо сонячні електростанції під ключ для дому та бізнесу
              у Львові та області. Власні монтажні бригади, сервіс і гарантія.
            </p>
          </div>
          <div className="mw-foot-col">
            <h4>Компанія</h4>
            <a href="/realizovani-proekty">Об&apos;єкти</a>
            <a href="/service-warranty">Гарантія та сервіс</a>
            <a href="/contacts">Контакти</a>
          </div>
          <div className="mw-foot-col">
            <h4>Послуги</h4>
            <a href="/ses/dom">СЕС для дому</a>
            <a href="/ses/business">СЕС для бізнесу</a>
            <a href="/komplekty-rezervnoho-zhyvlennia">Резервне живлення</a>
          </div>
          <div className="mw-foot-col">
            <h4>Контакти</h4>
            <a href={telHref(p)}>{p}</a>
            <a href={`mailto:${email}`}>{email}</a>
            <a className="mw-foot-cta" href="/contacts">Отримати розрахунок →</a>
          </div>
        </div>
        <div className="mw-footer-bottom">
          <span>© {new Date().getFullYear()} {legal}</span>
          <span className="mw-foot-tag">SOLAR EPC · MADE IN LVIV</span>
          <a href="/privacy">Політика конфіденційності</a>
        </div>
      </div>
    </footer>
  );
}
