# Parity Harness (P1)

Local-only parity tooling for SitePilot migration. **Isolated under `tools/parity/`** — no runtime, deploy, DNS, or OSCTL mutations.

## Scope (P1)

| Delivered | Not in P1 |
|-----------|-----------|
| `ParityConfig` schema (Zod) | HTTP collectors |
| `EV_RUNTIME` / `EV_SEO` / `EV_JSONLD` shapes | Live URL fetches |
| Dry-run CLI + JSON reports | Deploy / Cloudflare / Railway SDKs |
| `liveMode: false` default | Production origins in config |

## Commands

```bash
cd tools/parity
npm install
npm run type-check
npm run dry-run
```

Optional config path:

```bash
npm run dry-run -- --config config/default.parity.json
```

## Layout

```
tools/parity/
├── config/default.parity.json   # ParityConfig (origins null)
├── src/
│   ├── config/                  # ParityConfig schema + loader
│   ├── ev/                      # EV_RUNTIME, EV_SEO, EV_JSONLD
│   ├── safety/                  # P1 guards (no liveMode, no prod URLs)
│   ├── harness/                 # dry-run orchestration
│   ├── report/                  # local JSON report writer
│   └── cli/dry-run.ts           # CLI entry
└── reports/                     # dry-run output (gitignored *.json)
```

## Safety guarantees

- **No HTTP writes** — dry-run does not open outbound HTTP.
- **No deploy SDKs** — `wrangler`, Railway, Cloudflare clients forbidden in `package.json`.
- **No mutation code** — reports written only under `tools/parity/reports/`.
- **`liveMode` default `false`** — enabling live mode fails P1 safety check.
- **No production URLs** in default config (`baseline.origin` / `target.origin` are `null`).

## Dual-runtime / OSCTL

This harness does not modify:

- `backend/` runtime
- `marketing-web/` app
- `ops/osctl/` freeze
- Deploy configs or DNS

Spec references: `docs/parity/runtime.md`, `docs/parity/seo.md`.

## P2 readiness

Dry-run report includes `p2Readiness.go`. P1 ends with **GO for shape/schema work** and **NO-GO for live collectors** until P2 implements fetch/compare behind explicit `liveMode` + staging-only origins.
