import { Injectable } from '@nestjs/common';
import { PageBlock } from './page.entity';

@Injectable()
export class PreviewRenderer {

  render(title: string, blocks: PageBlock[], seo: {
    seoTitle?: string | null;
    seoDescription?: string | null;
  }): string {
    const body = blocks
      .sort((a, b) => a.order - b.order)
      .map(b => this.renderBlock(b))
      .join('\n');

    return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${this.esc(seo.seoTitle ?? title)}</title>
<meta name="description" content="${this.esc(seo.seoDescription ?? '')}">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6 }
  a { color: inherit; text-decoration: none }
  .container { max-width: 960px; margin: 0 auto; padding: 0 24px }

  /* Hero */
  .s-hero { background: linear-gradient(135deg, #f5a623 0%, #ff6b35 100%); color: #fff; padding: 80px 24px; text-align: center }
  .s-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; margin-bottom: 16px; line-height: 1.2 }
  .s-hero p  { font-size: 1.1rem; opacity: .9; max-width: 620px; margin: 0 auto 28px }
  .btn       { display: inline-block; background: #fff; color: #f5a623; font-weight: 700; font-size: 1rem; padding: 14px 32px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15) }
  .btn:hover { background: #ffe8b8 }
  .s-hero small { display: block; margin-top: 14px; opacity: .75; font-size: .85rem }

  /* Pain */
  .s-pain { padding: 64px 24px }
  .s-pain h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 32px; text-align: center }
  .pain-table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden }
  .pain-table th { background: #f9f9f9; padding: 12px 16px; font-size: .75rem; text-transform: uppercase; letter-spacing: .5px; color: #888; text-align: left }
  .pain-table td { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: .95rem }
  .pain-table tr:last-child td { border-bottom: none }
  .bad  { color: #e44; font-weight: 500 }
  .good { color: #22a35a; font-weight: 500 }

  /* Steps */
  .s-steps { background: #fafafa; padding: 64px 24px }
  .s-steps h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 40px; text-align: center }
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px }
  .step { background: #fff; border-radius: 12px; padding: 24px; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,.06) }
  .step-num { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f5a623; color: #fff; border-radius: 50%; font-weight: 800; font-size: .9rem; margin-bottom: 12px }
  .step h3 { font-size: 1rem; font-weight: 700; margin-bottom: 6px }
  .step p  { font-size: .875rem; color: #666 }

  /* Numbers */
  .s-numbers { background: #1a1a2e; color: #fff; padding: 64px 24px }
  .numbers-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 32px }
  .num-item { text-align: center; min-width: 130px }
  .num-item strong { display: block; font-size: 2.4rem; font-weight: 800; color: #f5a623; line-height: 1 }
  .num-item span { font-size: .85rem; opacity: .7; margin-top: 6px }

  /* Audience */
  .s-audience { padding: 64px 24px }
  .s-audience h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 32px; text-align: center }
  .audience-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px }
  @media (max-width: 640px) { .audience-grid { grid-template-columns: 1fr } }
  .audience-card { background: #f9f9f9; border-radius: 12px; padding: 28px }
  .audience-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px }
  .audience-card p  { color: #555; font-size: .95rem }

  /* Guarantees */
  .s-guarantees { background: #fafafa; padding: 64px 24px }
  .s-guarantees h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 28px; text-align: center }
  .guar-list { list-style: none; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px }
  .guar-list li { background: #fff; border-radius: 8px; padding: 14px 18px; font-size: .95rem; box-shadow: 0 1px 4px rgba(0,0,0,.06) }

  /* Offers */
  .s-offers { padding: 64px 24px }
  .s-offers h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 28px; text-align: center }
  .offer-card { background: #fff8ec; border: 2px solid #f5a623; border-radius: 14px; padding: 32px; max-width: 560px; margin: 0 auto }
  .offer-card h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 16px }
  .offer-items { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px }
  .offer-items li::before { content: '✓ '; color: #22a35a; font-weight: 700 }
  .offer-cta { color: #f5a623; font-weight: 700 }

  /* CTA */
  .s-cta { background: linear-gradient(135deg, #1a1a2e 0%, #2d2d5e 100%); color: #fff; padding: 72px 24px; text-align: center }
  .s-cta h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 16px }
  .s-cta p  { opacity: .8; margin-bottom: 28px; max-width: 500px; margin-left: auto; margin-right: auto }
  .s-cta .btn { background: #f5a623; color: #000 }
  .s-cta small { display: block; margin-top: 14px; opacity: .55; font-size: .8rem }

  /* FAQ */
  .s-faq { padding: 64px 24px }
  .s-faq h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 28px; text-align: center }
  .faq-item { border-bottom: 1px solid #eee; padding: 16px 0 }
  .faq-q { font-weight: 700; margin-bottom: 8px }
  .faq-a { color: #555; font-size: .95rem }
</style>
</head>
<body>
${body}
</body>
</html>`;
  }

  private renderBlock(block: PageBlock): string {
    const d = (block.data ?? {}) as Record<string, any>;

    switch (block.type) {

      case 'hero':
        return `<section class="s-hero">
  <div class="container">
    <h1>${this.esc(d.title ?? '')}</h1>
    <p>${this.esc(d.subtitle ?? '')}</p>
    <a class="btn" href="#">${this.esc(d.cta ?? 'Дізнатись більше')}</a>
    ${d.subtext ? `<small>${this.esc(d.subtext)}</small>` : ''}
  </div>
</section>`;

      case 'pain': {
        const rows = (d.items ?? []).map((i: any) => `
    <tr>
      <td class="bad">${this.esc(i.problem ?? '')}</td>
      <td class="good">${this.esc(i.solution ?? '')}</td>
    </tr>`).join('');
        return `<section class="s-pain">
  <div class="container">
    <h2>${this.esc(d.title ?? 'Наші рішення')}</h2>
    <table class="pain-table">
      <thead><tr><th>Ситуація</th><th>Що отримуєте з нами</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
      }

      case 'steps': {
        const steps = (d.items ?? []).map((s: any, i: number) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <h3>${this.esc(s.title ?? '')}</h3>
      <p>${this.esc(s.description ?? '')}</p>
    </div>`).join('');
        return `<section class="s-steps">
  <div class="container">
    <h2>${this.esc(d.title ?? 'Як це працює')}</h2>
    <div class="steps-grid">${steps}</div>
  </div>
</section>`;
      }

      case 'numbers': {
        const nums = (d.items ?? []).map((n: any) => `
    <div class="num-item">
      <strong>${this.esc(n.value ?? '')}</strong>
      <span>${this.esc(n.label ?? '')}</span>
    </div>`).join('');
        return `<section class="s-numbers">
  <div class="container">
    <div class="numbers-grid">${nums}</div>
  </div>
</section>`;
      }

      case 'audience': {
        const show = d.show ?? 'both';
        const cards: string[] = [];
        if (show === 'both' || show === 'home') {
          cards.push(`<div class="audience-card"><h3>🏠 Для дому</h3><p>${this.esc(d.home ?? '')}</p></div>`);
        }
        if (show === 'both' || show === 'business') {
          cards.push(`<div class="audience-card"><h3>🏢 Для бізнесу</h3><p>${this.esc(d.business ?? '')}</p></div>`);
        }
        return `<section class="s-audience">
  <div class="container">
    <h2>Для кого</h2>
    <div class="audience-grid">${cards.join('')}</div>
  </div>
</section>`;
      }

      case 'guarantees': {
        const items = (d.items ?? []).map((g: string) =>
          `<li>${this.esc(g)}</li>`).join('');
        return `<section class="s-guarantees">
  <div class="container">
    <h2>Наші гарантії</h2>
    <ul class="guar-list">${items}</ul>
  </div>
</section>`;
      }

      case 'offers': {
        const offer = d.offer ?? {};
        const items = (offer.items ?? []).map((i: string) =>
          `<li>${this.esc(i)}</li>`).join('');
        return `<section class="s-offers">
  <div class="container">
    <h2>Спеціальна пропозиція</h2>
    <div class="offer-card">
      <h3>${this.esc(offer.title ?? '')}</h3>
      <ul class="offer-items">${items}</ul>
      <p class="offer-cta">${this.esc(offer.cta ?? '')}</p>
      <a class="btn" href="#" style="margin-top:16px;display:inline-block;background:#f5a623;color:#000">Залишити заявку</a>
    </div>
  </div>
</section>`;
      }

      case 'cta':
        return `<section class="s-cta">
  <div class="container">
    <h2>${this.esc(d.title ?? 'Готові почати?')}</h2>
    <p>${this.esc(d.text ?? '')}</p>
    <a class="btn" href="#">${this.esc(d.button ?? 'Залишити заявку')}</a>
    ${d.subtext ? `<small>${this.esc(d.subtext)}</small>` : ''}
  </div>
</section>`;

      case 'faq': {
        const faqs = (d.items ?? []).map((f: any) => `
    <div class="faq-item">
      <p class="faq-q">${this.esc(f.question ?? '')}</p>
      <p class="faq-a">${this.esc(f.answer ?? '')}</p>
    </div>`).join('');
        return `<section class="s-faq">
  <div class="container">
    <h2>Часті питання</h2>
    ${faqs}
  </div>
</section>`;
      }

      default:
        return `<section style="padding:40px 24px;background:#f9f9f9"><div class="container"><p style="color:#aaa;text-align:center">Блок: ${block.type}</p></div></section>`;
    }
  }

  private esc(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
