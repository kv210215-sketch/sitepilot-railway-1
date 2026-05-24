# Projection mismatch scenario

Used by `run_validation.py` to inject drift into a freshly rendered projection directory.

Steps (automated in runner):

1. Fold + render `clean-deploy-chain` events to temp dir.
2. Append `<!-- drift -->` to `CURRENT_STATUS.md`.
3. Call `verify_projection_match` — expect `projection mismatch`.

Do not commit drifted projection files; this scenario is runtime-only.
