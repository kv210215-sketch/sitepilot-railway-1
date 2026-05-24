# OSCTL Freeze Signoff Checklist

**Mode:** Human signoff checklist only  
**Applies to:** Freeze headers, freeze bump decisions, and `osctl-freeze/1.5` signoff  
**Rule:** Signoff must be human-owned and reviewable.

---

## Owner Signoff

- [ ] Owner confirms the action is part of the already-approved governance stabilization sequence.
- [ ] Owner confirms no backend, CI, package, deploy, Railway, Cloudflare, runtime, or production file is included.
- [ ] Owner confirms whether the change is editorial, append-only, edit-restricted, or freeze-bump required.
- [ ] Owner confirms validation has passed before the commit-sized unit is accepted.
- [ ] Owner records name, date, and scope of signoff.

Required owner statement:

```text
I approve this OSCTL governance stabilization action as human-owned, scoped, validation-gated, and non-runtime.
```

---

## Reviewer Signoff

- [ ] Reviewer verifies the diff matches the approved LR item.
- [ ] Reviewer verifies no hidden authority, automation, deploy hook, CI mutation, or product/runtime change is present.
- [ ] Reviewer verifies freeze headers do not alter invariant meaning.
- [ ] Reviewer verifies archive moves, if present, follow prerequisites and use `git mv`.
- [ ] Reviewer verifies validation evidence is preserved when required.

Required reviewer statement:

```text
I reviewed this OSCTL governance stabilization action and found it scoped to approved human execution.
```

---

## Freeze Bump Requirements

A freeze bump is required when a change alters any of the following:

- Invariant text in `FREEZE_v1.md`.
- Frozen decisions in `ARCHITECTURE_FREEZE.md`.
- Canonical path declarations.
- Role definitions in governance or human-boundary documents.
- Forbidden capabilities or authority boundaries.
- Ledger authority, append-only semantics, replay guarantees, verification rules, or rollback policy.
- Source-of-truth chain semantics.
- The approved lifecycle or stop-rule.

Freeze bump minimum requirements:

1. Explicit human owner approval.
2. Explicit reviewer approval.
3. Isolated commit scope.
4. Validation before and after the change.
5. Append-only fingerprint preservation in `HASH_REGISTRY.md` when applicable.
6. Updated signoff rows in the freeze document.
7. Rollback plan by `git revert`.

---

## Immutable Sections

Treat these as immutable unless a human-approved freeze bump is performed:

- `FREEZE_v1.md` invariant sections.
- `ARCHITECTURE_FREEZE.md` frozen decisions and signoff rows after publication.
- FULLY FROZEN verdicts and observations.
- Prior sections of APPEND-ONLY files.
- Published validation fingerprints in `HASH_REGISTRY.md`.
- Ledger events.
- Stop-rule language after publication.

---

## What Requires Freeze Bump

- Rewriting invariant, role, authority, path, or forbidden-capability text.
- Changing the source-of-truth chain.
- Changing canonical file membership.
- Changing append-only or replay behavior.
- Changing validation acceptance criteria.
- Moving a canonical file into archive.
- Creating a new authority layer or new audit phase.
- Authorizing automation where human authority is currently final.

---

## What Does Not Require Freeze Bump

- Typo fixes that do not change meaning.
- Link fixes that preserve the same source of truth.
- Approved freeze header bands that only document existing classification.
- Approved redirects that reduce duplicate authority without changing canonical semantics.
- Archive moves of already-superseded plans after prerequisites are met.
- Appending new dated sections to APPEND-ONLY files.
- Regenerating validation evidence after an approved validation run.
- Running read-only validation commands.

---

## Signoff Stop Conditions

Do not sign off if:

- The operator cannot identify the LR item being applied.
- The diff mixes OSCTL governance with backend/runtime work.
- Validation fails.
- A freeze-bump trigger is treated as editorial.
- A non-human actor is asked to own final authority.
- The rollback path is unclear.
