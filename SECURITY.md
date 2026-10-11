# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅ Yes    |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report vulnerabilities using one of these channels:

1. **GitHub Private Advisory** (preferred): [Create a private advisory](https://github.com/sairam0424/Inkforge/security/advisories/new)
2. **Email**: `sairam.ugge@gmail.com` — subject line `[SECURITY] Inkforge vulnerability`

Please include:
- Type of vulnerability (e.g. credential exposure, prompt injection, SSRF)
- Affected file paths and line numbers
- Steps to reproduce
- Potential impact

**Response SLA**: Acknowledgment within 48 hours · Resolution timeline within 7 days.

## Security Considerations

### API Keys & Credentials

Inkforge handles several external API credentials (AWS Bedrock, Anthropic, Dev.to). Medium and Hashnode publishing drive your own logged-in Chrome through browser-harness and need no API key.

- All credentials are loaded **exclusively** from environment variables — never hardcoded
- `.env` is gitignored and must never be committed
- See `.env.example` for the complete list of required variables
- Base64 credential handling in `packages/core/src/llm/index.ts` uses round-trip equality verification to prevent accidental decoding of non-base64 values
- The `bedrockCreds()` function reads `BEDROCK_REGION` first and falls back to `AWS_REGION`, then `us-east-1`, so platforms that mangle reserved variable names can use the dedicated name

### LLM Input and Output

- User input is forwarded to AWS Bedrock or Anthropic API — review your provider's data handling and privacy policies before processing sensitive content
- Generated content is written to the **local filesystem only** — no external storage by default
- No prompt injection prevention is implemented beyond standard LLM system prompt guardrails
- Do not pass secrets, PII, or confidential data as input to the generation pipeline

### Publishing Credentials

- The Dev.to API key is used solely for publishing — stored in `.env`. `HASHNODE_API_KEY` is legacy (Hashnode's public API was decommissioned) and is read only for a status indicator in the web UI
- Published content sets `canonical_url` pointing back to your portfolio — cross-posting is SEO-safe
- The `/api/config` endpoint in `@inkforge/web` returns configured/not-configured booleans, the provider name and the content and mirror directory paths — never actual key values

### Supply Chain

- All dependencies are pinned in `pnpm-lock.yaml`
- Run `pnpm audit` regularly to check for known vulnerabilities
- A moderate severity vulnerability exists in `postcss` (via `next@16.2.9`) — no upstream fix available at this version; it affects CSS processing only and is not exploitable in Inkforge's context

### GitHub Actions

- CI workflows do not have access to production secrets
- Dependency audit runs on every push and PR
- Secret scanning runs on every push via the built-in workflow

## Out of Scope

- Vulnerabilities in upstream LLM providers (AWS Bedrock, Anthropic)
- AI-generated article content
- Third-party publishing platforms (Dev.to, Hashnode, Medium, Substack)
- Issues in `node_modules` that are not reachable through Inkforge's code paths
