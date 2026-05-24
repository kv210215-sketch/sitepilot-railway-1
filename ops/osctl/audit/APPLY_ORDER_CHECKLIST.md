# OSCTL Apply Order Checklist

**Mode:** Human checklist only  
**Authority:** Existing LR-1 through LR-12 recommendations  
**Rule:** Do not reorder unless a human owner records the reason before execution.

---

## Ordered Checklist

- [ ] **LR-1** - Apply Round 3 section 6 actions 1-8 as a single docs-only governance entrypoint change.
  - Scope: documentation only.
  - Gate: no backend, CI, package, deploy, or runtime files.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-3** - Apply Round 4 `SOURCE_OF_TRUTH_REDUCTION.md` section 2 restatement removals.
  - Scope: remove duplicate source-of-truth restatements.
  - Gate: every removed restatement must point to a canonical source.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-4** - Apply Round 4 `GOVERNANCE_REDUCTION_PLAN.md` section 3 snapshot merges and redirects.
  - Scope: merge unique content and replace superseded snapshot files with redirects where approved.
  - Gate: preserve path stability for snapshot tooling and examples.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-9** - Add FULLY FROZEN and APPEND-ONLY header bands per `FREEZE_CANDIDATES.md` section 9.
  - Scope: editorial headers only.
  - Gate: no invariant, role, path, or forbidden-capability changes.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-5** - Create the approved `ops/osctl/archive/` sub-tree per `ARCHIVE_RECOMMENDATIONS.md` section 2.
  - Scope: archive directories and one index README only.
  - Gate: archive remains storage, not authority.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-6** - Move Round 4 section 3 draft files into `archive/drafts/`.
  - Scope: approved draft files only.
  - Gate: use `git mv`; no content edits during the move.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-10** - Add `osctl-freeze/1.5` owner and reviewer sign-off rows in `ARCHITECTURE_FREEZE.md`.
  - Scope: sign-off rows only.
  - Gate: owner and reviewer must be real humans.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-2** - Apply path reconciliation if explicitly approved by the human owner.
  - Scope: isolated path reconciliation and required freeze bump only.
  - Gate: B-2 action; do not combine with docs-only work.
  - Validation: run `python ops/osctl/validation/run_validation.py` before and after.

- [ ] **LR-7** - Move Round 4 section 4 hygiene files into `archive/hygiene/` after hygiene is applied.
  - Scope: one-shot hygiene workflow records.
  - Gate: anchoring and cleanup must already be complete.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-8** - Move Round 4 section 5 consolidation files into `archive/consolidation/` after Round 3 actions are applied.
  - Scope: superseded consolidation plans only.
  - Gate: successor canonical sources must already contain the applied content.
  - Validation: run `python ops/osctl/validation/run_validation.py`.

- [ ] **LR-11** - Re-run validation after every commit-sized unit and abort on regression.
  - Scope: read-only validation.
  - Gate: no commit from a failing validation state.
  - Evidence: preserve validation fingerprints when the freeze policy requires it.

- [ ] **LR-12** - Adopt the PR-time review checklist from `GOVERNANCE_MAINTENANCE_PROTOCOL.md` section 5.
  - Scope: process only.
  - Gate: human review remains final.
  - Evidence: reviewers apply the checklist before approving governance PRs.

---

## Hard Stops

- Stop if execution order becomes ambiguous.
- Stop if backend or infrastructure paths enter scope.
- Stop if validation fails.
- Stop if a freeze-bump trigger appears without explicit human owner approval.
- Stop if any action would create a new audit round or governance authority.
