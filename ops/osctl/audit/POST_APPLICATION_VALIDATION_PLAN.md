# OSCTL Post-Application Validation Plan

**Mode:** Human validation plan only  
**Purpose:** Verify that applied governance stabilization stayed scoped, reproducible, and non-runtime  
**Rule:** Validation is read-only and does not authorize deployment.

---

## 1. Run Validation Suite

Required command:

```powershell
python ops/osctl/validation/run_validation.py
```

Expected result:

- Validation completes successfully.
- No regression appears in replay, projection, serialization, or verification behavior.
- Any new validation fingerprint is appended, not rewritten, where policy requires preservation.

Stop if validation fails.

---

## 2. Check No Pycache

Required check:

```powershell
git status --short
```

Review outcome:

- No `__pycache__/` files.
- No `.pyc` files.
- No local caches staged or tracked.
- No generated interpreter artifacts included in OSCTL commits.

Stop if generated cache artifacts appear.

---

## 3. Check Git Status

Required check:

```powershell
git status --short
```

Review outcome:

- Only intended OSCTL governance files are dirty before commit.
- After commit, working tree is clean or contains only explicitly isolated non-OSCTL work.
- Backend and runtime changes remain separated.

Stop if unrelated dirty paths appear in the governance branch.

---

## 4. Check Tracked OSCTL Files

Required review:

```powershell
git diff --stat
git diff --name-only
```

Review outcome:

- Canonical governance files changed only according to approved LR items.
- Archive moves are visible as moves, not copy-delete churn.
- Redirect files preserve path stability.
- Validation evidence matches the tree being validated.
- No new audit round, new authority document, or new trust layer was introduced.

Stop if the changed file set exceeds the approved scope.

---

## 5. Check No Backend, CI, or Package Changes

Forbidden paths in OSCTL governance commits:

- `backend/**`
- `.github/**`
- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `docker-compose.yml`
- Deploy files
- Railway files
- Cloudflare files
- Runtime orchestration scripts
- Production mutation scripts

Stop if any forbidden path appears.

---

## 6. Check No Deploy Hooks

Review for:

- New deploy scripts.
- New Railway or Cloudflare commands.
- New CI jobs.
- New package scripts.
- New runtime orchestration entrypoints.
- New hooks that can mutate production.

Stop if governance stabilization adds any deploy-capable mechanism.

---

## 7. Check No Hidden Orchestration Authority

Review for:

- New automation authority.
- New agent authority.
- New scheduler or loop.
- New service account expectation.
- New runtime controller.
- New external write path.
- Language that converts recommendations into autonomous execution.

Expected result:

- Human authority remains final.
- Validation remains read-only.
- Archive remains storage only.
- Governance maintenance remains event-driven and human-owned.

Stop if hidden orchestration authority appears.

---

## Final Validation Record

The human operator should record:

```text
Validation command: python ops/osctl/validation/run_validation.py
Validation result: PASS or FAIL
Git status reviewed: yes/no
Forbidden paths absent: yes/no
Pycache absent: yes/no
Deploy hooks absent: yes/no
Hidden orchestration absent: yes/no
Owner:
Reviewer:
Date:
HEAD:
```

Do not create external anchors from a failed or partially reviewed state.
