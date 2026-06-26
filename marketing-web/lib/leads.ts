import { getAttribution } from './attribution';
import { publicLeadSubmitUrl } from './public-api';

export interface LeadSubmitInput {
  /** Required by the backend (POST /public/v1/leads). Comes from the page DTO. */
  projectId: string;
  /** Optional page id (page the form was rendered on). */
  pageId?: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  message?: string;
  /** Logical origin (website_form, cta_block, calculator, …) — stored in metadata. */
  source?: string;
  /** GDPR consent flag. */
  consent?: boolean;
  /** Honeypot value (hidden field). Bots fill it; the backend drops such leads. */
  website?: string;
  /** Extra structured fields (e.g. ROI calculator inputs/results) — merged into metadata. */
  meta?: Record<string, unknown>;
}

export interface LeadSubmitResult {
  ok: boolean;
  status: number;
}

/**
 * Submits a lead to the backend public API using the contract the production
 * backend (origin/main) expects:
 *   { projectId(req), pageId?, name, email?, phone?, message?, pagePath?,
 *     consent?, website?(honeypot), metadata? }
 *
 * All marketing attribution (UTM, referrer, first-touch landing page, gclid/
 * fbclid, source, city) is packed into `metadata` because the backend uses a
 * strict `forbidNonWhitelisted` pipe and rejects unknown flat fields.
 *
 * Fires a GA4 `generate_lead` event on success. Single source of truth for every
 * public lead entry point (contact form, ROI calculator, …).
 */
export async function submitLead(input: LeadSubmitInput): Promise<LeadSubmitResult> {
  const url = publicLeadSubmitUrl();
  if (!url || !input.projectId) {
    // Without an API base or a project id we cannot submit.
    return { ok: false, status: 0 };
  }

  const attr = getAttribution();
  const source = input.source ?? 'website_form';

  const metadata: Record<string, unknown> = {
    source,
    ...(input.city ? { city: input.city } : {}),
    ...(attr.landingPage ? { landingPage: attr.landingPage } : {}),
    ...(attr.utmSource ? { utmSource: attr.utmSource } : {}),
    ...(attr.utmMedium ? { utmMedium: attr.utmMedium } : {}),
    ...(attr.utmCampaign ? { utmCampaign: attr.utmCampaign } : {}),
    ...(attr.utmTerm ? { utmTerm: attr.utmTerm } : {}),
    ...(attr.utmContent ? { utmContent: attr.utmContent } : {}),
    ...(attr.gclid ? { gclid: attr.gclid } : {}),
    ...(attr.fbclid ? { fbclid: attr.fbclid } : {}),
    ...(attr.referrer ? { referrer: attr.referrer } : {}),
    ...(input.meta ?? {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: input.projectId,
      pageId: input.pageId || undefined,
      name: input.name,
      email: input.email || undefined,
      phone: input.phone || undefined,
      message: input.message || undefined,
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      consent: input.consent ?? true,
      website: input.website || undefined,
      metadata,
    }),
  });

  if (res.ok) {
    try {
      const w = window as unknown as {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
      };
      // GA4 (gtag.js) conversion event — collected when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
      w.gtag?.('event', 'generate_lead', { lead_source: source });
      // GTM-style dataLayer push — for sites wired through Google Tag Manager.
      w.dataLayer?.push({ event: 'generate_lead', lead_source: source });
    } catch {
      /* analytics not present */
    }
  }

  return { ok: res.ok, status: res.status };
}

/** Maps a fetch status to a localized (uk) error message. */
export function leadErrorMessage(status: number): string {
  if (status === 429) return 'Забагато спроб. Спробуйте за хвилину.';
  if (status === 400) return 'Перевірте правильність заповнення полів.';
  if (status === 404) return 'Сервіс тимчасово недоступний.';
  if (status === 0) return 'Сервіс тимчасово недоступний.';
  return 'Не вдалося надіслати. Спробуйте ще раз.';
}
