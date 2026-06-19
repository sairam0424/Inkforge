# Contributing to Inkforge

Thank you for your interest in contributing! Here's everything you need to get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Adding a Publisher](#adding-a-publisher)
- [Adding a Generation Format](#adding-a-generation-format)

---

## Development Setup

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
git clone https://github.com/sairam0424/Inkforge.git
cd Inkforge
pnpm install
cp .env.example .env          # fill in BEDROCK_ or ANTHROPIC_API_KEY at minimum
pnpm build
pnpm test                     # should show 11/11 passing
```

---

## Branching Strategy

```
main      ←  production releases only (protected)
develop   ←  integration branch — all features merge here
feature/* ←  one branch per feature or fix
```

**Always branch from `develop`:**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

Never branch directly from `main`.

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

Types:   feat | fix | refactor | docs | test | chore | perf | ci
Scopes:  core | cli | web | pipeline | llm | rag | publishers | schema | content
```

**Examples:**

```
feat(pipeline): add interactive clarification mode before outline
fix(llm): handle 403 explicit-deny as fallback-eligible error
docs(readme): add carousel PDF publishing workflow
test(ingest): add code-first mode with exported function anchors
chore(deps): bump vitest to 4.2
```

---

## Pull Request Process

1. Branch from `develop` — never from `main`
2. Keep PRs focused — one logical change per PR
3. Run `pnpm build && pnpm test` before opening
4. Fill out the PR template completely
5. PRs require **1 approval** before merge
6. Use `--no-ff` merge (preserve merge commit history)
7. Branches are auto-deleted after merge

---

## Code Style

- **TypeScript strict mode** — no implicit `any` without justification
- **Immutability** — create new objects, never mutate in-place
- **No magic numbers** — use named constants from `src/modes/index.ts`
- **Files under 500 lines** — split into focused modules when larger
- **No comments explaining WHAT** — only comment the WHY (hidden constraints, non-obvious invariants)
- **No trailing summaries** — don't add "this function adds X" docstrings

---

## Testing

```bash
pnpm --filter @inkforge/core test         # run tests
pnpm --filter @inkforge/core test:watch   # watch mode
```

Rules:
- All new pipeline stages must have **unit tests with mock LLM responses**
- Tests live in `src/**/__tests__/` mirroring the source structure
- Use **vitest** — not jest
- Test the public interface, not implementation details

---

## Adding a Publisher

1. Create `packages/core/src/publishers/<platform>.ts`
2. Export `publishTo<Platform>(article, opts)` returning `{ url: string }`
3. Auth via `process.env.PLATFORM_API_KEY` — never hardcode
4. Add a subpath export to `packages/core/package.json`:
   ```json
   "./publishers/<platform>": {
     "import": "./dist/publishers/<platform>.js"
   }
   ```
5. Wire into `packages/cli/src/commands/publish.ts`
6. Document the env var in `.env.example`
7. Add platform to `CLAUDE.md` publishing rules section

---

## Adding a Generation Format

1. Add to `FormatSchema` in `packages/core/src/schema/index.ts`
2. Add structural instructions to `FORMAT_INSTRUCTIONS` in `packages/core/src/modes/index.ts`
3. Add to `--format` CLI option in `packages/cli/src/commands/generate.ts`
4. Add to `DialSelector` format options in `apps/web/src/components/generator/GeneratorForm.tsx`

---

## Questions?

- **Bugs** → [Open an issue](https://github.com/sairam0424/Inkforge/issues/new/choose)
- **Questions / ideas** → [Start a discussion](https://github.com/sairam0424/Inkforge/discussions)
- **Security** → See [SECURITY.md](SECURITY.md)
