# OSCTL Human Execution Plan

**Mode:** Human execution planning only  
**Authority:** Human owner final  
**Scope:** Apply already-approved governance stabilization actions  
**Non-goals:** No deploy, Railway, Cloudflare, backend edits, CI mutation, package changes, commits, push, merge, staging, runtime orchestration, or production mutation by an agent

---

## Principle

VERIFY before ACT.  
STABILIZE before EXPAND.  
HUMAN AUTHORITY FINAL.

This plan does not authorize autonomous execution. It defines the manual order a human operator may follow after isolating the workspace and confirming that no product, infrastructure, CI, or package changes are mixed into OSCTL governance work.

---

## Phase 1: Prepare Workspace

1. Open a dedicated OSCTL documentation branch or worktree.
2. Ensure the branch contains only OSCTL governance stabilization work.
3. Keep backend, Docker, deploy, Railway, Cloudflare, package, and CI changes out of scope.
4. Confirm no agent will stage, commit, push, merge, deploy, or run infrastructure commands.
5. Record the current human operator and reviewer before touching canonical governance files.

Manual gate: continue only when the operator can explain which files belong to OSCTL governance and which files belong to product/runtime work.

---

## Phase 2: Confirm Clean Git Status

1. Run `git status --short`.
2. Confirm there are no modified or untracked backend, CI, package, Docker, deploy, Railway, Cloudflare, secret, or generated cache files in the OSCTL execution branch.
3. Confirm `__pycache__/` and other generated artifacts are absent from staged scope.
4. If any unrelated path is dirty, stop and isolate it before continuing.

Manual gate: OSCTL governance execution must begin from a status that is clean or dirty only in explicitly reviewed OSCTL documentation paths.

---

## Phase 3: Separate Backend Changes

1. Identify all dirty product/runtime paths, especially `backend/`, `docker-compose.yml`, deploy files, package files, and CI files.
2. Move product work to a product branch, stash it, or place OSCTL work in a clean worktree.
3. Do not include product paths in any `ops(osctl):` commit.
4. Do not use OSCTL governance execution to modify application behavior.

Manual gate: no backend or runtime path may appear in OSCTL diffs.

---

## Phase 4: Apply Governance Reductions

1. Apply LR-1: Round 3 section 6 actions 1-8 as one docs-only governance entrypoint change.
2. Apply LR-3: Round 4 source-of-truth restatement removals.
3. Apply LR-4: Round 4 snapshot merges and redirects.
4. Keep edits scoped to the already-approved canonical reductions.
5. Do not create a new audit round, new trust layer, new registry, or new authority document.

Manual gate: every reduction must point back to the approved Round 3, Round 4, or Round 5 source.

---

## Phase 5: Apply Freeze Headers

1. Apply LR-9 by adding FULLY FROZEN and APPEND-ONLY header bands as classified in `FREEZE_CANDIDATES.md`.
2. Do not change invariant text while adding headers.
3. Do not freeze active working documents that `FREEZE_CANDIDATES.md` leaves active.
4. Treat header application as editorial only.

Manual gate: if a proposed edit changes invariant text, role definitions, path declarations, or forbidden capabilities, stop and use the freeze-bump protocol instead.

---

## Phase 6: Apply Archive Moves

1. Apply LR-5 by creating the approved `ops/osctl/archive/` tree only when the human owner is ready to perform archive work.
2. Apply LR-6 by moving approved draft files into `archive/drafts/`.
3. Apply LR-7 only after hygiene has been applied and anchoring is complete.
4. Apply LR-8 only after Round 3 consolidation actions have been applied.
5. Use `git mv` for archive moves.
6. Do not edit file content in the same commit as a move, except the approved archive README index.

Manual gate: archive is storage only. It is not a new trust layer.

---

## Phase 7: Apply Source-of-Truth Redirects

1. Replace superseded restatements with redirects only where already approved.
2. Preserve path stability for snapshot documents that must remain in place.
3. Redirect to canonical governance sources, not to audit observations unless specifically approved.
4. Keep each redirect small enough to review independently.

Manual gate: a redirect must reduce duplicate authority rather than introduce a new one.

---

## Phase 8: Apply Path Reconciliation If Approved

1. Apply LR-2 only if the human owner approves the path reconciliation.
2. Treat LR-2 as B-2 because it includes a code-path decision and freeze bump.
3. Keep the path reconciliation isolated from all docs-only reductions.
4. Run validation before and after the change.
5. Do not combine LR-2 with backend, CI, package, deploy, archive, or unrelated governance changes.

Manual gate: if the human owner does not explicitly approve LR-2, leave it pending.

---

## Phase 9: Run Validation

1. Apply LR-11 after every commit-sized unit.
2. Run `python ops/osctl/validation/run_validation.py`.
3. Abort the sequence on any regression.
4. Preserve validation fingerprints according to `HASH_REGISTRY.md` append-only rules.
5. Do not treat validation as deployment or runtime orchestration.

Manual gate: no commit should be created from a failing validation state.

---

## Phase 10: Create Human Commits

1. Create small, reversible commits in the sequence defined by `HUMAN_COMMIT_SEQUENCE.md`.
2. Use one authority domain per commit.
3. Exclude backend, CI, package, Docker, deploy, Railway, Cloudflare, secrets, pycache, and generated runtime artifacts.
4. Include the validation result in trust/governance commit messages.
5. Prefer `git revert` for rollback.

Manual gate: a human must review the diff before each commit.

---

## Phase 11: Add External Head-Hash Anchoring

1. After the final validation-passing OSCTL commit, record the git HEAD hash outside the repository.
2. Prefer a signed commit or signed tag if local signing is available.
3. Preserve validation fingerprints beside the external head-hash record.
4. Assign ownership for where the external record lives.
5. Do not let an agent write, publish, or mutate the external anchor.

Manual gate: external anchoring is a human responsibility and remains outside OSCTL automation authority.

---

## Stop Conditions

Stop immediately if any of the following appears:

- Backend, CI, package, deploy, Railway, Cloudflare, Docker, or production path enters an OSCTL commit.
- Validation fails.
- A freeze-bump trigger is discovered but not approved.
- Archive moves are attempted before their prerequisite reductions are applied.
- A new audit round, authority document, trust layer, or orchestration mechanism is proposed.
- The operator cannot explain the rollback for the current step.
