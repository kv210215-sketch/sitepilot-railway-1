# OSCTL Agent Authority Map

**Principle:** VERIFY before ACT — agents read; humans act  
**Ledger:** authoritative · **Snapshots:** non-authoritative

---

## Authority Roles

```text
┌─────────────────┐
│  Human Operator │ ◄── sole production + infra authority
└────────┬────────┘
         │ approves append / acts on infra
         ▼
┌─────────────────┐     read-only      ┌─────────────────┐
│  Validator Agent│ ◄──────────────────│  Architect Agent │
│  (validation)   │                    │  (design/docs)   │
└────────┬────────┘                    └─────────────────┘
         │ evidence                          │ no runtime write
         ▼                                   ▼
┌─────────────────┐     read-only      ┌─────────────────┐
│  Snapshot Agent │ ◄──────────────────│   CI Agent      │
│  (verify/compare)│                   │  (read verify)  │
└────────┬────────┘                    └─────────────────┘
         │ never act
         ▼
┌─────────────────┐
│  Deploy Agent   │ ◄── FORBIDDEN in OSCTL scope
└─────────────────┘
```

---

## Role Definitions

| Role | May do | May not do |
|------|--------|------------|
| **Architect agent** | Design docs, snapshot format, boundaries | Append ledger, deploy, CI edits |
| **Validator agent** | Run validation, produce evidence | Mutate production, anchor externally |
| **Snapshot agent** | Run `verify_snapshot`, `compare_snapshot` | Export/write snapshots without human, act on results |
| **Deploy agent** | N/A in OSCTL | Any Railway/Cloudflare/backend deploy |
| **CI agent** | Read-only `verify` in pipeline (future) | Auto-append, snapshot write, deploy without human |
| **Human operator** | Append, export snapshot, infra, anchor hash | Delegate production go/no-go to agents |

---

## Forbidden Cross-Authority Actions

| From → To | Action | Verdict |
|-----------|--------|---------|
| Snapshot agent → Deploy | Trigger rollback from stale snapshot | **FORBIDDEN** |
| Validator agent → Ledger | Auto-fix failed verify | **FORBIDDEN** |
| CI agent → Ledger | Silent append on deploy success | **FORBIDDEN** (without freeze) |
| Architect agent → Infra | Add Railway hook | **FORBIDDEN** |
| Any agent → Snapshot | Treat as source of truth | **FORBIDDEN** |
| Deploy agent → OSCTL | Grant orchestration via snapshot field | **FORBIDDEN** |
| Snapshot agent → Ledger | Restore state from snapshot | **FORBIDDEN** |

---

## Required Agent Workflow (Operational Read)

```text
1. Human or CI: ops.osctl.core verify     (ledger)
2. Human or CI: ops.osctl.core replay     (projections)
3. Optional: compare_snapshot --ledger    (snapshot check)
4. Human: decision / infra action
```

Agents stop at step 3 unless explicitly instructed to run read-only commands.

---

## Escalation Paths

| Condition | Escalate to |
|-----------|-------------|
| verify fails | Human operator |
| compare_snapshot drift | Human operator |
| Agent unsure of seq head | Human operator |
| Deploy needed | Human owner (outside OSCTL) |

---

## Cross-References

- `ops/osctl/BOUNDARIES.md`
- `SNAPSHOT_TRUST_BOUNDARIES.md`
- `CAPABILITY_MATRIX.md`
- `ops/osctl/HUMAN_BOUNDARIES.md`
