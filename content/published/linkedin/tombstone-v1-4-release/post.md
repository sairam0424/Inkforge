---
slug: tombstone-v1-4-release
platform: linkedin
type: text-post
status: draft
---

## Post caption (longer variant — primary)

See post-caption.txt

## Post text (shorter single-text-post alternative)

Tombstone v1.4.2 is out — production intelligence for feature flags, hardened from the running system up through deployment.

New since v1.2:
- Helm chart now deploys all 5 services (was missing 3) + optional HPA
- Python SDK reaches full evaluation parity with the TypeScript SDK — zero new deps
- Redoc API explorer embedded in flag-api, no CDN dependency
- Flux CD v2.3+ GitOps with dependsOn + healthChecks for correct CRD ordering
- Argo CD added as a second GitOps controller — split responsibility, ML rollout percentages protected
- Argo Rollouts canary analysis now gates on the evaluator's blast-radius score directly (LOW/MEDIUM promotes, HIGH/BLOCKED aborts)
- CI hardened — no more `|| true`, all Actions pinned to immutable SHAs

Self-hosted. MIT licensed. `make dev` to start everything locally.

GitHub: https://github.com/sairam0424/Tombstone

## Upload instructions

1. Go to LinkedIn -> Create post
2. Paste post-caption.txt as the post body (or use the shorter variant above if you want a tighter post)
3. Add a genuine reply to the first few comments within 2 hours
4. Link: https://github.com/sairam0424/Tombstone
