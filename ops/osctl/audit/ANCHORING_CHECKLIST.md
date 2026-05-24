# OSCTL Anchoring Checklist

**Mode:** Human anchoring checklist only  
**Purpose:** Preserve git, validation, and external head-hash evidence after governance stabilization  
**Rule:** External anchoring remains human responsibility.

---

## Git Anchoring

- [ ] Confirm the final governance stabilization branch contains only approved OSCTL work.
- [ ] Confirm every commit is small, reversible, and scoped to one authority domain.
- [ ] Confirm validation passed before every OSCTL trust/governance commit.
- [ ] Confirm commit messages reference validation where relevant.
- [ ] Confirm no backend, CI, package, deploy, Railway, Cloudflare, Docker, runtime, or production changes are mixed in.
- [ ] Confirm no `__pycache__` or generated local artifacts are tracked.
- [ ] Record the final HEAD hash after validation passes.

Recommended local command for the human operator:

```powershell
git rev-parse HEAD
```

---

## Signed Commit or Tag Recommendation

Preferred options, subject to local signing setup:

1. Use signed commits for the OSCTL stabilization sequence.
2. Add a signed tag after the final validation-passing commit.
3. Name the tag in a way that reflects governance stabilization, not deployment or release.

Example tag naming pattern:

```text
osctl-governance-stabilized-YYYYMMDD
```

Do not create a tag from an unvalidated or mixed-authority tree.

---

## External Head-Hash Recording

The human owner should record the final HEAD hash outside the repository after validation passes.

Acceptable external records:

- Signed release note.
- Password-manager secure note.
- Organization change-management record.
- Ticket or issue controlled by the human owner.
- Offline operator log.

Required external record fields:

- Repository name.
- Branch name.
- Final HEAD hash.
- Validation command used.
- Validation result.
- Date and time.
- Human owner.
- Human reviewer.
- Scope summary.
- Statement that no production mutation was performed.

---

## Validation Fingerprint Preservation

- [ ] Preserve existing fingerprints without rewriting prior entries.
- [ ] Append new fingerprints only when a validation run or freeze bump requires a new record.
- [ ] Keep validation evidence tied to the exact git tree it validates.
- [ ] Do not replace failed validation evidence silently.
- [ ] Do not record a final anchor before validation passes.

Recommended evidence bundle:

```text
HEAD=<final commit hash>
Validation=python ops/osctl/validation/run_validation.py
Result=PASS
Fingerprints=<HASH_REGISTRY.md section or external operator note>
Owner=<human owner>
Reviewer=<human reviewer>
```

---

## What Remains Human Responsibility

- Choosing whether to use signed commits or a signed tag.
- Creating and protecting the external head-hash record.
- Reviewing the final diff before each commit.
- Confirming no backend/runtime work is mixed into OSCTL governance.
- Deciding whether LR-2 path reconciliation is approved.
- Approving freeze bumps.
- Preserving validation evidence outside the repository if required by organizational policy.
- Rejecting any automation or agent attempt to claim final authority.

---

## Anchoring Stop Conditions

Stop before anchoring if:

- The tree contains unresolved backend, CI, package, deploy, Railway, Cloudflare, Docker, runtime, or production changes.
- Validation fails.
- The final HEAD hash cannot be tied to a reviewed commit sequence.
- The external record location has no human owner.
- The operator cannot distinguish git anchoring from production deployment.
