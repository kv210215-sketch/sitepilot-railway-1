# Parity Harness (P2)

Local-only parity tooling for SitePilot migration. **Isolated under `tools/parity/`** — no runtime, deploy, DNS, or OSCTL mutations.

## Scope

| Delivered (P2) | Not in P2 |
|----------------|-----------|
| `ParityConfig` schema (Zod) | Diff engine / EV field comparison (P3) |
| `EV_RUNTIME` / `EV_SEO` / `EV_JSONLD` shapes | Deploy / Cloudflare / Railway SDKs |
| Read-only GET collectors | POST/PUT/PATCH/DELETE |
| Dry-run CLI + JSON reports | Production origins in default config |
| `liveMode: false` default | Backend / marketing-web runtime changes |

## Commands

```bash
cd tools/parity
npm install
npm run type-check
npm test
npm run dry-run
```

Optional config path:

```bash
npm run dry-run -- --config config/default.parity.json
```

## Layout

```
tools/parity/
├── config/default.parity.json
├── fixtures/manifest.json         # fixture registry (deterministic names)
├── fixtures/parity-fixture-*.html # synthetic offline HTML fixtures
├── fixtures/sample-home.html      # legacy alias of reference-home
├── src/
│   ├── config/
│   ├── ev/
│   ├── http/get-client.ts         # GET-only; liveMode gate
│   ├── collectors/                # Runtime / SEO / JSON-LD
│   ├── safety/
│   ├── harness/
│   ├── report/
│   └── cli/dry-run.ts
└── reports/                       # gitignored *.json
```

## Collector safety

- **GET only** — `ParityGetClient` rejects non-GET methods and non-http(s) URLs.
- **liveMode gate** — outbound HTTP only when `liveMode=true`.
- **Default dry-run** — `liveMode=false` plans actions and returns `source: planned-only` without network.
- **Forbidden origins** — production host fragments blocked in config (see `safety/guards.ts`).
- **User-Agent** — `SitePilot-Parity-Harness/0.2 (read-only; GET-only)`.

## Dual-runtime / OSCTL

This harness does not modify:

- `backend/` runtime
- `marketing-web/` app
- `ops/osctl/` freeze
- Deploy configs or DNS

Spec references: `docs/parity/runtime.md`, `docs/parity/seo.md`.

## P3 readiness

Dry-run report includes `p3Readiness` with diff engine blockers. P2 ends with **GO for read-only collectors** and **NO-GO for diff engine** until P3.
