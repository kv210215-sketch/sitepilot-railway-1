/** @type {import('next').NextConfig} */

// Solomiya Tilda → SitePilot 301 redirect layer (GO 4.1).
// Per SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md §6 ("nearest relevant page, never blanket-to-homepage").
// These 23 Tilda URLs have no published SitePilot page yet (drafts with owner-content/spec placeholders),
// so each 301s to the nearest live page until/unless a real page is published (URL is 1:1 → clean swap).
// EXCLUDED on purpose (now live after GO 3, must NOT redirect): / , /ses , /ses/dom , /ses/business ,
// /installation , /service-warranty , /ses/ground , /contacts.
// Uses an explicit HTTP 301 (statusCode) as required by the migration plan, not Next's default 308.
// Inert while DNS still points at Tilda; takes effect only on the marketing-web service after cutover.
const to = (source, destination) => ({ source, destination, statusCode: 301 });

const solomiyaRedirects = [
  // Power tiers (ses/*) — residential intent → /ses/dom, business-scale intent → /ses/business
  to('/ses/5kw', '/ses/dom'),
  to('/ses/10kw', '/ses/dom'),
  to('/ses/20kw', '/ses/business'),
  to('/ses/30kw', '/ses/business'),
  to('/ses/50kw', '/ses/business'),

  // Batteries — category hub + subcategories/vendors → nearest hub /ses
  to('/batteries', '/ses'),
  to('/batteries/hv', '/ses'),
  to('/batteries/lv', '/ses'),
  to('/batteries/dyness', '/ses'),
  to('/batteries/pytes', '/ses'),

  // Inverters — category hub + subcategories/vendors → /ses; backup ↔ home resilience → /ses/dom
  to('/inverters', '/ses'),
  to('/inverters/hybrid', '/ses'),
  to('/inverters/grid', '/ses'),
  to('/inverters/offgrid', '/ses'),
  to('/inverters/backup', '/ses/dom'),
  to('/inverters/deye', '/ses'),
  to('/inverters/huawei', '/ses'),

  // Solar panels — category/vendor → /ses; home-panels ↔ home segment → /ses/dom
  to('/solar-panels', '/ses'),
  to('/solar-panels-longi', '/ses'),
  to('/sonyachni-paneli-dlya-domu', '/ses/dom'),

  // Misc product/service — backup kits ↔ home segment; mounting ↔ installation; portfolio → /ses
  to('/komplekty-rezervnoho-zhyvlennia', '/ses/dom'),
  to('/kriplennia', '/installation'),
  to('/realizovani-proekty', '/ses'),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return solomiyaRedirects;
  },
};

module.exports = nextConfig;
