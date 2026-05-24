# SitePilot Operations

Operational layer for release discipline, state tracking, and future OSCTL implementation.

```
ops/
├── README.md                 ← this file
├── state/                    ← human-operated templates + checklists (Phase 1–1.5)
│   ├── README.md
│   ├── *.template.md
│   ├── RELEASE_CHECKLIST.md
│   ├── ROLLBACK_CHECKLIST.md
│   ├── STATE_TRANSITIONS.md
│   └── GOVERNANCE.md
└── osctl/                    ← frozen governance + ledger spec (Phase 1.5+)
    ├── ARCHITECTURE_*.md
    ├── examples/             ← deterministic event payloads
    └── ledger/               ← Phase 2: append-only JSONL (not created yet)
```

**Rule:** Templates in `ops/state/` are filled manually until OSCTL projections replace them (Phase 2).

**Canonical governance:** `ops/osctl/ARCHITECTURE_DECISIONS.md`, `ops/state/GOVERNANCE.md`
