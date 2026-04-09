import { Injectable } from '@nestjs/common';

export interface SeoInput {
  title:     string;
  city?:     string;
  power?:    number;
  audience?: 'home' | 'business';
  domain?:   string;
}

export interface SeoOutput {
  slug:            string;
  h1:              string;
  seoTitle:        string;
  seoDescription:  string;
  seoKeywords:     string;
  ogTitle:         string;
  ogDescription:   string;
  canonicalUrl?:   string;
}

@Injectable()
export class SeoService {

  // ── Генерація повного SEO-набору ────────────────────────────────────────────

  generate(input: SeoInput): SeoOutput {
    const { title, city, power, audience, domain } = input;

    const slug    = this.generateSlug({ title, city, power, audience });
    const h1      = this.buildH1(title, city, power);
    const seot    = this.buildMetaTitle(title, city, power);
    const seod    = this.buildMetaDescription(title, city, power, audience);
    const ogTitle = seot;
    const ogDesc  = seod;
    const keys    = this.buildKeywords(title, city, power, audience);
    const canon   = domain ? `https://${domain}/${slug}` : undefined;

    return {
      slug,
      h1,
      seoTitle:       seot,
      seoDescription: seod,
      seoKeywords:    keys,
      ogTitle,
      ogDescription:  ogDesc,
      canonicalUrl:   canon,
    };
  }

  // ── Slug ───────────────────────────────────────────────────────────────────

  generateSlug(input: {
    title: string; city?: string; power?: number; audience?: string;
  }): string {
    const parts: string[] = [];

    // З назви — якщо вона вже містить все
    const baseSlug = this.transliterate(input.title);

    // Якщо назва не містить місто/потужність — додаємо
    if (input.city && !baseSlug.includes(this.transliterate(input.city))) {
      parts.push(baseSlug);
      parts.push(this.transliterate(input.city));
    } else if (input.power && !baseSlug.includes(`${input.power}`)) {
      parts.push(baseSlug);
      parts.push(`${input.power}kwt`);
    } else {
      parts.push(baseSlug);
    }

    return parts
      .join('-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200);
  }

  // ── H1 ────────────────────────────────────────────────────────────────────

  private buildH1(title: string, city?: string, power?: number): string {
    if (city && power) {
      return `${title} ${power} кВт у ${city}`;
    }
    if (city) return `${title} у ${city}`;
    if (power) return `${title} ${power} кВт`;
    return title;
  }

  // ── Meta Title ────────────────────────────────────────────────────────────

  private buildMetaTitle(title: string, city?: string, power?: number): string {
    const brand = 'Solomiya Energy';
    let base    = title;

    if (power) base += ` ${power} кВт`;
    if (city)  base += ` ${city}`;

    const full = `${base} | ${brand}`;
    return full.length <= 70 ? full : `${base.substring(0, 52)}... | ${brand}`;
  }

  // ── Meta Description ──────────────────────────────────────────────────────

  private buildMetaDescription(
    title: string, city?: string, power?: number, audience?: string,
  ): string {
    const cityPart     = city  ? ` у ${city}` : ' по всій Україні';
    const powerPart    = power ? ` ${power} кВт` : '';
    const audiencePart = audience === 'business'
      ? 'для бізнесу — скоротіть витрати на електрику на 70-90%'
      : 'для дому — живіть без відключень з економією 70-90%';

    const desc = `${title}${powerPart}${cityPart}. Монтаж за 1 день, гарантія 25 років. ✅ ${audiencePart}. Безкоштовний розрахунок.`;
    return desc.length <= 160 ? desc : desc.substring(0, 157) + '...';
  }

  // ── Keywords ─────────────────────────────────────────────────────────────

  private buildKeywords(
    title: string, city?: string, power?: number, audience?: string,
  ): string {
    const base = ['сонячна електростанція', 'сонячні панелі', 'СЕС', 'Solomiya Energy'];
    if (city)     base.push(`СЕС ${city}`, `сонячні панелі ${city}`);
    if (power)    base.push(`СЕС ${power} кВт`, `${power} кВт`);
    if (audience === 'business') base.push('СЕС для бізнесу', 'промислова СЕС');
    if (audience === 'home')     base.push('СЕС для дому', 'домашня сонячна станція');
    return base.join(', ');
  }

  // ── Перевірка унікальності slug ──────────────────────────────────────────

  makeUniqueSlug(slug: string, existingSlugs: string[]): string {
    if (!existingSlugs.includes(slug)) return slug;
    let counter = 2;
    while (existingSlugs.includes(`${slug}-${counter}`)) counter++;
    return `${slug}-${counter}`;
  }

  // ── Транслітерація UA/RU → latin ────────────────────────────────────────

  transliterate(text: string): string {
    const map: Record<string, string> = {
      'а':'a','б':'b','в':'v','г':'h','д':'d','е':'e','є':'ye','ж':'zh',
      'з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m',
      'н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
      'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya',
      'ё':'yo','э':'e','ъ':'','ы':'y',
    };

    return text
      .toLowerCase()
      .split('')
      .map(c => map[c] ?? c)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }

  // ── Валідація SEO ────────────────────────────────────────────────────────

  validateSeo(seo: Partial<SeoOutput>): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!seo.seoTitle)                 warnings.push('Meta title відсутній');
    if ((seo.seoTitle?.length ?? 0) > 70)  warnings.push('Meta title > 70 символів');
    if (!seo.seoDescription)           warnings.push('Meta description відсутній');
    if ((seo.seoDescription?.length ?? 0) > 160) warnings.push('Meta description > 160 символів');
    if (!seo.h1)                       warnings.push('H1 відсутній');
    if (!seo.slug)                     warnings.push('Slug відсутній');

    return { valid: warnings.length === 0, warnings };
  }
}
