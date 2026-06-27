/**
 * Marketing attribution capture (client-side).
 *
 * Reads UTM / click-id params from the current URL, the document referrer, and
 * persists *first-touch* attribution in localStorage so a lead submitted on a
 * later page still carries the campaign that originally brought the visitor in.
 */

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
}

const STORAGE_KEY = 'sp_attribution_v1';

function readCurrentUrlAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const get = (k: string): string | undefined => params.get(k)?.trim() || undefined;

  const attr: Attribution = {
    utmSource: get('utm_source'),
    utmMedium: get('utm_medium'),
    utmCampaign: get('utm_campaign'),
    utmTerm: get('utm_term'),
    utmContent: get('utm_content'),
    gclid: get('gclid'),
    fbclid: get('fbclid'),
    landingPage: window.location.pathname + window.location.search,
  };

  const ref = document.referrer?.trim();
  // Ignore same-origin referrers — only external traffic sources are useful.
  if (ref && !ref.startsWith(window.location.origin)) {
    attr.referrer = ref.slice(0, 500);
  }

  return attr;
}

function hasSignal(attr: Attribution): boolean {
  return Boolean(
    attr.utmSource || attr.utmMedium || attr.utmCampaign ||
    attr.gclid || attr.fbclid || attr.referrer,
  );
}

/**
 * Returns first-touch attribution, persisting it on the first visit that
 * carries any campaign signal. Subsequent visits reuse the stored value.
 */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};

  const current = readCurrentUrlAttribution();

  let stored: Attribution | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as Attribution;
  } catch {
    stored = null;
  }

  // Persist first-touch the first time we see a real campaign signal.
  if (!stored && hasSignal(current)) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      /* storage blocked — fall back to in-session values */
    }
    stored = current;
  }

  // Merge: first-touch campaign wins; page_path always reflects the current page.
  return { ...current, ...(stored ?? {}) };
}
