# Medium & Hashnode Browser-Backed Publishers Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give Inkforge's `inkforge publish` CLI real `medium` and `hashnode` platforms that drive the operator's own logged-in Chrome via `browser-harness` (deterministic scripted CDP automation, no LLM) instead of throwing "not supported" errors.

**Architecture:** Two new files in `packages/core/src/publishers/` (`medium.ts`, rewritten `hashnode.ts`) share a thin `browser-harness-client.ts` wrapper that spawns the `browser-harness` CLI binary, pipes it a Python script over stdin (using browser-harness's real pre-imported helpers — `new_tab`, `fill_input`, `js`, `click_at_xy`, `wait_for_load`, `page_info`, `ensure_real_tab`), and parses one JSON line the script prints on completion. Both publishers match `publishToDevto`'s existing `(article, opts) => Promise<{id, url}>` contract exactly, so `packages/cli/src/commands/publish.ts` dispatches to all three platforms through one small registry instead of duplicated if/else branches. A login-wall check runs before any other browser action and throws without ever touching a credential field.

**Tech Stack:** TypeScript (Node 20, ESM), `node:child_process.spawn` (no new npm dependency), `browser-harness` CLI binary (external, already installed on the operator's machine — see Global Constraints), Vitest 4 (`vi.mock` for `node:child_process` and sibling modules — no existing precedent in this repo, this plan establishes the convention), Zod's existing `ArticleOutput` type from `packages/core/src/schema/index.ts`.

**Spec:** This plan replaces the stale portfolio-research claims below with what was actually found reading the live repo on 2026-09-09:

| Claim in prior research | Verified reality |
|---|---|
| "the click-path is already fully documented step-by-step in CLAUDE.md" | **False as stated.** `CLAUDE.md` (lines 123–170) and `docs/publishing.md` (lines 33–96) document *rules and a 5-bullet high-level recipe* (Medium: import via `medium.com/p/import`; Hashnode: paste into the editor manually), not a selector-level click path. See "Disclosed limitation" below. |
| "hashnode.ts exists in some broken/stubbed state — rehabilitate it" | **Not broken — deliberately stubbed.** `packages/core/src/publishers/hashnode.ts` (20 lines) always throws, with a comment explaining Hashnode's public GraphQL API (`gql.hashnode.com`) was decommissioned in 2026 with no replacement. Nothing to "rehabilitate" — it needs a full rewrite to a browser-driven implementation, which is exactly what this plan does. |
| "Inkforge already uses Playwright for cover-image rendering — reuse or avoid duplicating it" | **False.** `grep -r playwright` across all non-`node_modules`/`dist` source returns zero hits. The only Playwright reference is a **Python** code snippet in `docs/architecture.md` (lines 132–142) documenting a manual, ad-hoc SVG→PNG workflow — it is not an npm dependency, not wired into `packages/core`, and has no TypeScript code anywhere in this repo. There is nothing to be "redundant" with: `browser-harness` (Python CLI, drives the user's real Chrome via CDP) and the documented cover-image workflow (Python + Playwright, headless, ad hoc, image rendering only) share no code and serve different purposes (interactive publish automation vs. static image capture). **Recommendation:** keep them fully separate; do not add an npm Playwright dependency for this feature. |
| "browser-harness attaches to the user's real running Chrome" | **Confirmed**, and more specifically: `browser-harness` is a CLI binary (`~/.local/bin/browser-harness`) that reads a **Python** script from stdin and executes it via `exec(code, globals())` against a local daemon already connected to Chrome over CDP (verified by reading `browser-harness/src/browser_harness/run.py` and `helpers.py` directly). This means a plain Node.js function (not an MCP tool call, which only an agent host can make) CAN drive it — by spawning the `browser-harness` binary as a child process. This is the mechanism this plan uses. |
| Live-verify Medium's/Hashnode's current editor DOM before hardcoding the click path | **Attempted, could not complete.** A live `browser_goto("https://medium.com/p/import")` and `browser_goto("https://example.com")` in this planning session both failed (`Page.navigate timed out` / `chrome-error://chromewebdata`) — this sandboxed environment has no outbound network access for the browser. Exact CSS selectors for Medium's "Import" button and Story Settings panel, and Hashnode's editor DOM, are **not live-verified** and this is called out explicitly in Task 3 and Task 4 rather than papered over with fabricated selectors. |

**Disclosed limitation (read before implementing Tasks 3–4):** The click-path scripts below use browser-harness's real, verified pre-imported helpers (confirmed by reading `browser-harness/src/browser_harness/helpers.py` source directly — `fill_input`, `js`, `click_at_xy`, `wait_for_load`, `page_info`, `ensure_real_tab`, `new_tab`) combined with **text-content element matching** (e.g. "find the button whose text matches `/import/i`") rather than CSS class selectors, since Medium's and Hashnode's exact current DOM could not be live-verified in this session (see table above). This is real, complete, runnable code — not a placeholder — but the implementing engineer MUST run each script once against their own logged-in Chrome (Task 3 Step 4, Task 4 Step 4) and adjust the text-match patterns if Medium/Hashnode's copy has changed, before considering either publisher done. Scope is deliberately capped at the import/paste + a simple "Publish" click; neither publisher scripts Medium's Story Settings panel or Hashnode's SEO-settings panel (tag chips, canonical-URL confirmation) — those panels' triggers have no reliably text-matchable label and were not verified. That work is left as an explicit manual follow-up recorded in each publish's tracking-record note (Task 2/4/5).

## Global Constraints
- **Never automate login.** Medium/Hashnode publishers must never enter credentials, MFA codes, or handle consent/account-choice screens. If the operator is not already logged in, the publisher throws `LoginRequiredError` and takes zero further browser action — per `browser-harness`'s own `SKILL.md`: "Login walls: stop and ask... still stop for passwords, MFA, consent, or ambiguous account choice."
- **CLI-only, never the web app.** `browser-harness` drives the operator's own local Chrome via a local daemon; it has no meaning in a deployed/serverless context. Medium and Hashnode must NOT be reachable from `apps/web/src/app/api/publish/route.ts` — Task 6 adds an explicit guard there instead of letting it attempt (and fail confusingly on) a `browser-harness` spawn.
- **`publishToMedium`'s `opts.canonicalBase` is REQUIRED**, unlike `publishToDevto`'s optional one — Medium's `medium.com/p/import` flow needs a live source URL to import from; there is no raw-markdown path.
- **Signature parity.** `publishToMedium` and `publishToHashnode` both return `Promise<{ id: string; url: string }>`, matching `publishToDevto`'s existing `(article: ArticleOutput, opts?) => Promise<{id, url}>` shape, so `packages/cli/src/commands/publish.ts` can dispatch to all three through one registry (Task 6).
- **No new npm dependency.** `browser-harness` is invoked as an external CLI binary via `node:child_process.spawn`, resolved via `BROWSER_HARNESS_BIN` env var (default `"browser-harness"`, must be on `PATH`) — this plan does not install or bootstrap `browser-harness` itself.
- **Node >=20**, ESM (`"type": "module"`), matches every existing `packages/core` / `packages/cli` file.
- Files under 500 lines; one concern per file (matches this repo's existing `packages/core/src/publishers/*.ts` — each currently 16–53 lines: `substack.ts`=16, `hashnode.ts`=20, `devto.ts`=53).

---

### Task 1: browser-harness process wrapper + login-wall detection
**Files:**
- Create: `packages/core/src/publishers/browser-harness-client.ts`
- Test: `packages/core/src/publishers/__tests__/browser-harness-client.test.ts`

**Interfaces:**
- Produces: `runBrowserHarnessScript(pythonScript: string, opts?: { binPath?: string; timeoutMs?: number }): Promise<Record<string, unknown>>`, `ensureLoggedIn(platform: string, entryUrl: string): Promise<void>`, `isLoginWallUrl(url: string): boolean`, `class LoginRequiredError extends Error`. Consumed by Task 4 (`medium.ts`) and Task 5 (`hashnode.ts`).

- [ ] Write the failing test at `packages/core/src/publishers/__tests__/browser-harness-client.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { EventEmitter } from "node:events";

  const spawnMock = vi.fn();
  vi.mock("node:child_process", () => ({ spawn: (...args: unknown[]) => spawnMock(...args) }));

  import {
    runBrowserHarnessScript,
    ensureLoggedIn,
    isLoginWallUrl,
    LoginRequiredError,
  } from "../browser-harness-client.js";

  function makeFakeProcess() {
    const proc = new EventEmitter() as EventEmitter & {
      stdin: { write: (chunk: string) => void; end: () => void };
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    proc.stdin = { write: vi.fn(), end: vi.fn() };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    return proc;
  }

  describe("isLoginWallUrl", () => {
    it("detects a signin redirect", () => {
      expect(isLoginWallUrl("https://medium.com/m/signin?operation=login")).toBe(true);
    });
    it("returns false for a normal editor URL", () => {
      expect(isLoginWallUrl("https://medium.com/p/abc123/edit")).toBe(false);
    });
  });

  describe("runBrowserHarnessScript", () => {
    beforeEach(() => spawnMock.mockReset());

    it("parses the last JSON line printed by the script", async () => {
      const proc = makeFakeProcess();
      spawnMock.mockReturnValue(proc);
      const promise = runBrowserHarnessScript("print('hi')");
      proc.stdout.emit("data", Buffer.from('some log line\n{"url":"https://medium.com/p/abc/edit"}\n'));
      proc.emit("close", 0);
      await expect(promise).resolves.toEqual({ url: "https://medium.com/p/abc/edit" });
    });

    it("rejects when the process exits non-zero", async () => {
      const proc = makeFakeProcess();
      spawnMock.mockReturnValue(proc);
      const promise = runBrowserHarnessScript("boom");
      proc.stderr.emit("data", Buffer.from("daemon connection refused"));
      proc.emit("close", 1);
      await expect(promise).rejects.toThrow(/daemon connection refused/);
    });
  });

  describe("ensureLoggedIn", () => {
    beforeEach(() => spawnMock.mockReset());

    it("resolves when the resulting URL is not a login wall", async () => {
      const proc = makeFakeProcess();
      spawnMock.mockReturnValue(proc);
      const promise = ensureLoggedIn("Medium", "https://medium.com/p/import");
      proc.stdout.emit("data", Buffer.from('{"url":"https://medium.com/p/import"}\n'));
      proc.emit("close", 0);
      await expect(promise).resolves.toBeUndefined();
    });

    it("throws LoginRequiredError when redirected to a signin page", async () => {
      const proc = makeFakeProcess();
      spawnMock.mockReturnValue(proc);
      const promise = ensureLoggedIn("Medium", "https://medium.com/p/import");
      proc.stdout.emit("data", Buffer.from('{"url":"https://medium.com/m/signin?next=/p/import"}\n'));
      proc.emit("close", 0);
      await expect(promise).rejects.toThrow(LoginRequiredError);
    });
  });
  ```
- [ ] Run it and confirm it fails: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/browser-harness-client.test.ts` — expected failure: `Error: Failed to resolve import "../browser-harness-client.js"` (file does not exist yet).
- [ ] Write the minimal implementation at `packages/core/src/publishers/browser-harness-client.ts`:
  ```ts
  import { spawn } from "node:child_process";

  export class LoginRequiredError extends Error {
    constructor(platform: string, loginUrl: string) {
      super(
        `Not logged in to ${platform} in your Chrome browser (currently at ${loginUrl}). ` +
          `Log in to ${platform} yourself in that browser, then re-run this command. ` +
          `This tool never enters credentials, MFA codes, or handles login on your behalf.`,
      );
      this.name = "LoginRequiredError";
    }
  }

  const LOGIN_WALL_PATTERNS = [/\/signin/i, /\/login/i, /accounts\.google\.com/i, /\/session\/new/i, /\/m\/signin/i];

  export function isLoginWallUrl(url: string): boolean {
    return LOGIN_WALL_PATTERNS.some((pattern) => pattern.test(url));
  }

  export async function runBrowserHarnessScript(
    pythonScript: string,
    opts?: { binPath?: string; timeoutMs?: number },
  ): Promise<Record<string, unknown>> {
    const binPath = opts?.binPath ?? process.env.BROWSER_HARNESS_BIN ?? "browser-harness";
    const timeoutMs = opts?.timeoutMs ?? 60_000;

    return new Promise((resolvePromise, reject) => {
      const proc = spawn(binPath, [], { stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`browser-harness script timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      proc.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn browser-harness at "${binPath}": ${err.message}`));
      });
      proc.on("close", (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(`browser-harness exited with code ${code}: ${(stderr || stdout).trim()}`));
          return;
        }
        const lines = stdout.trim().split("\n").filter((line) => line.trim().length > 0);
        const lastLine = lines[lines.length - 1];
        if (!lastLine) {
          reject(new Error("browser-harness produced no output"));
          return;
        }
        try {
          resolvePromise(JSON.parse(lastLine) as Record<string, unknown>);
        } catch {
          reject(new Error(`browser-harness output was not valid JSON: ${lastLine}`));
        }
      });

      proc.stdin?.write(pythonScript);
      proc.stdin?.end();
    });
  }

  /**
   * Navigate to `entryUrl` and check whether the operator is already logged in.
   * Throws LoginRequiredError (without touching any credential field) if the
   * resulting URL looks like a login wall. On success the daemon keeps this tab
   * attached across the *next* browser-harness invocation too (browser-harness's
   * own documented behaviour), so the caller's follow-up script should use
   * ensure_real_tab() rather than new_tab() again.
   */
  export async function ensureLoggedIn(platform: string, entryUrl: string): Promise<void> {
    const script = [
      `ENTRY_URL = ${JSON.stringify(entryUrl)}`,
      "new_tab(ENTRY_URL)",
      "wait_for_load()",
      'print(json.dumps({"url": page_info()["url"]}))',
    ].join("\n");

    const result = await runBrowserHarnessScript(script);
    const currentUrl = String(result.url ?? "");
    if (isLoginWallUrl(currentUrl)) {
      throw new LoginRequiredError(platform, currentUrl);
    }
  }
  ```
- [ ] Run it and confirm it passes: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/browser-harness-client.test.ts` — expect `4 passed` (isLoginWallUrl ×2, runBrowserHarnessScript ×2) plus `ensureLoggedIn ×2` = 6 total.
- [ ] Commit:
  ```bash
  git add packages/core/src/publishers/browser-harness-client.ts packages/core/src/publishers/__tests__/browser-harness-client.test.ts
  git commit -m "feat(core): add browser-harness process wrapper with login-wall detection"
  ```

---

### Task 2: Published-tracking record writer
**Files:**
- Create: `packages/core/src/publishers/published-tracking.ts`
- Test: `packages/core/src/publishers/__tests__/published-tracking.test.ts`

**Interfaces:**
- Produces: `type PublishedPlatform`, `type PublishedTrackingRecord`, `writePublishedTrackingRecord(platform: PublishedPlatform, record: PublishedTrackingRecord, opts?: { contentDir?: string }): string`. Consumed by Task 4 (`medium.ts`) and Task 5 (`hashnode.ts`).
- Matches the exact frontmatter template documented in `CLAUDE.md` (lines 101–113) and `content/published/README.md` — no code in this repo currently writes these files (every file under `content/published/*` today was hand-authored; confirmed by `grep -rln "content/published" packages/*/src` returning zero matches).

- [ ] Write the failing test at `packages/core/src/publishers/__tests__/published-tracking.test.ts`:
  ```ts
  import { describe, it, expect, afterEach } from "vitest";
  import { existsSync, readFileSync, rmSync } from "node:fs";
  import { dirname, resolve } from "node:path";
  import { fileURLToPath } from "node:url";
  import { writePublishedTrackingRecord } from "../published-tracking.js";

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const TEST_DIR = resolve(__dirname, "__fixtures__/published");

  describe("writePublishedTrackingRecord", () => {
    afterEach(() => {
      rmSync(TEST_DIR, { recursive: true, force: true });
    });

    it("writes a frontmatter record matching the documented template", () => {
      const filePath = writePublishedTrackingRecord(
        "medium",
        {
          slug: "how-dns-works",
          title: "How DNS Actually Works",
          publishedUrl: "https://medium.com/@sairam/how-dns-works-abc123",
          publishedDate: "2026-09-09",
          canonicalUrl: "https://anvilry.vercel.app/notes/how-dns-works",
          status: "live",
        },
        { contentDir: TEST_DIR },
      );
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("slug: how-dns-works");
      expect(content).toContain('title: "How DNS Actually Works"');
      expect(content).toContain("published_url: https://medium.com/@sairam/how-dns-works-abc123");
      expect(content).toContain("canonical_url: https://anvilry.vercel.app/notes/how-dns-works");
      expect(content).toContain("status: live");
    });

    it("creates the platform subdirectory if it does not exist", () => {
      const filePath = writePublishedTrackingRecord(
        "hashnode",
        {
          slug: "test-article",
          title: "Test Article",
          publishedUrl: "https://sairam.hashnode.dev/test-article",
          publishedDate: "2026-09-09",
          status: "draft",
        },
        { contentDir: TEST_DIR },
      );
      expect(filePath).toContain(`${TEST_DIR}/hashnode/test-article.md`.replace(/\//g, resolve("/")[0] === "/" ? "/" : "\\"));
      expect(existsSync(filePath)).toBe(true);
    });
  });
  ```
- [ ] Run it and confirm it fails: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/published-tracking.test.ts` — expected failure: `Failed to resolve import "../published-tracking.js"`.
- [ ] Write the minimal implementation at `packages/core/src/publishers/published-tracking.ts`:
  ```ts
  import { existsSync, mkdirSync, writeFileSync } from "node:fs";
  import { dirname, resolve } from "node:path";

  export type PublishedPlatform = "medium" | "hashnode" | "devto" | "substack" | "linkedin";

  export type PublishedTrackingRecord = {
    slug: string;
    title: string;
    publishedUrl: string;
    publishedDate: string; // YYYY-MM-DD
    canonicalUrl?: string;
    status: "live" | "draft" | "scheduled";
    notes?: string;
  };

  /**
   * Writes content/published/<platform>/<slug>.md, matching the template
   * documented in CLAUDE.md ("Published Tracking") and content/published/README.md.
   */
  export function writePublishedTrackingRecord(
    platform: PublishedPlatform,
    record: PublishedTrackingRecord,
    opts?: { contentDir?: string },
  ): string {
    const baseDir = opts?.contentDir ?? resolve(process.cwd(), "content/published");
    const filePath = resolve(baseDir, platform, `${record.slug}.md`);
    if (!existsSync(dirname(filePath))) {
      mkdirSync(dirname(filePath), { recursive: true });
    }

    const frontmatterLines = [
      "---",
      `slug: ${record.slug}`,
      `title: "${record.title.replace(/"/g, '\\"')}"`,
      `published_url: ${record.publishedUrl}`,
      `published_date: ${record.publishedDate}`,
      ...(record.canonicalUrl ? [`canonical_url: ${record.canonicalUrl}`] : []),
      `status: ${record.status}`,
      "views: 0",
      "claps: 0",
      "---",
      "",
      record.notes ?? "",
      "",
    ];
    writeFileSync(filePath, frontmatterLines.join("\n"), "utf-8");
    return filePath;
  }
  ```
- [ ] Run it and confirm it passes: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/published-tracking.test.ts` — expect `2 passed`.
- [ ] Commit:
  ```bash
  git add packages/core/src/publishers/published-tracking.ts packages/core/src/publishers/__tests__/published-tracking.test.ts
  git commit -m "feat(core): add published-tracking record writer for medium/hashnode publishers"
  ```

---

### Task 3: Medium content validator
**Files:**
- Create: `packages/core/src/publishers/medium-content-validator.ts`
- Test: `packages/core/src/publishers/__tests__/medium-content-validator.test.ts`

**Interfaces:**
- Produces: `type MediumContentWarning`, `validateForMedium(body: string): MediumContentWarning[]`, `class MediumContentValidationError extends Error`. Consumed by Task 4 (`medium.ts`).
- This is the concrete "content transformation" `publishToDevto` does NOT do (`devto.ts` only sanitizes tag strings — it never inspects `article.body`). Encodes the constraints verified in `CLAUDE.md` lines 123–135 and `docs/publishing.md` lines 33–46: Medium supports only H1/H2 (no H3+) and no tables.

- [ ] Write the failing test at `packages/core/src/publishers/__tests__/medium-content-validator.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { validateForMedium, MediumContentValidationError } from "../medium-content-validator.js";

  describe("validateForMedium", () => {
    it("flags H3+ headings with their line number", () => {
      const warnings = validateForMedium("## Intro\n\n### Sub-point\n\nBody text.");
      expect(warnings).toEqual([{ type: "h3-heading", line: 3, text: "### Sub-point" }]);
    });

    it("flags markdown tables", () => {
      const body = "## Intro\n\n| A | B |\n| - | - |\n| 1 | 2 |\n";
      const warnings = validateForMedium(body);
      expect(warnings).toEqual([{ type: "table", line: 3 }]);
    });

    it("returns no warnings for Medium-safe content", () => {
      const warnings = validateForMedium("## Intro\n\n**Bold sub-point**\n\nBody text with no violations.");
      expect(warnings).toHaveLength(0);
    });
  });

  describe("MediumContentValidationError", () => {
    it("formats a readable message naming the violating line", () => {
      const err = new MediumContentValidationError([{ type: "h3-heading", line: 3, text: "### Sub-point" }]);
      expect(err.message).toContain("Line 3");
      expect(err.message).toContain("H3+ heading");
      expect(err.name).toBe("MediumContentValidationError");
    });
  });
  ```
- [ ] Run it and confirm it fails: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/medium-content-validator.test.ts` — expected failure: `Failed to resolve import "../medium-content-validator.js"`.
- [ ] Write the minimal implementation at `packages/core/src/publishers/medium-content-validator.ts`:
  ```ts
  export type MediumContentWarning =
    | { type: "h3-heading"; line: number; text: string }
    | { type: "table"; line: number };

  /**
   * Scans an article body for constructs Medium's editor cannot render, per
   * CLAUDE.md "Medium Publishing Rules" (verified 2026-06-19): no H3+ headings,
   * no tables.
   */
  export function validateForMedium(body: string): MediumContentWarning[] {
    const warnings: MediumContentWarning[] = [];
    const lines = body.split("\n");
    lines.forEach((line, idx) => {
      if (/^#{3,}\s/.test(line)) {
        warnings.push({ type: "h3-heading", line: idx + 1, text: line.trim() });
      }
      const nextLine = lines[idx + 1] ?? "";
      if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:-]+\|\s*$/.test(nextLine)) {
        warnings.push({ type: "table", line: idx + 1 });
      }
    });
    return warnings;
  }

  export class MediumContentValidationError extends Error {
    constructor(public readonly warnings: MediumContentWarning[]) {
      super(
        "Article body violates Medium editor constraints:\n" +
          warnings
            .map((w) =>
              w.type === "h3-heading"
                ? `  - Line ${w.line}: H3+ heading not supported by Medium: "${w.text}"`
                : `  - Line ${w.line}: Markdown table not supported by Medium`,
            )
            .join("\n") +
          "\nFix the source article body, or pass { force: true } to publish anyway.",
      );
      this.name = "MediumContentValidationError";
    }
  }
  ```
- [ ] Run it and confirm it passes: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/medium-content-validator.test.ts` — expect `4 passed`.
- [ ] Commit:
  ```bash
  git add packages/core/src/publishers/medium-content-validator.ts packages/core/src/publishers/__tests__/medium-content-validator.test.ts
  git commit -m "feat(core): add Medium content validator for H3 headings and tables"
  ```

---

### Task 4: Medium publisher
**Files:**
- Create: `packages/core/src/publishers/medium.ts`
- Test: `packages/core/src/publishers/__tests__/medium.test.ts`

**Interfaces:**
- Consumes: `ensureLoggedIn`, `runBrowserHarnessScript` (Task 1); `validateForMedium`, `MediumContentValidationError` (Task 3); `writePublishedTrackingRecord` (Task 2); `ArticleOutput` (`packages/core/src/schema/index.ts`, `PlatformSchema` extended — see step below).
- Produces: `type MediumPublishResult = { id: string; url: string }`, `publishToMedium(article: ArticleOutput, opts: { published?: boolean; canonicalBase: string; force?: boolean }): Promise<MediumPublishResult>`. Consumed by Task 6 (CLI registry).

- [ ] **Required schema change:** `PlatformSchema` in `packages/core/src/schema/index.ts` is currently `z.enum(["devto", "hashnode"])` — a closed enum that does not include `"medium"`. Update it to `z.enum(["devto", "hashnode", "medium"])` before writing the test below, otherwise the test fixture's `platforms: ["medium"]` (typed as `ArticleOutput`) fails to type-check under this package's `strict: true` tsconfig (`error TS2322: Type '"medium"' is not assignable to type '"devto" | "hashnode"'`), which will also fail Task 6's `pnpm --filter @inkforge/core build` step. This is the only schema-level change in this plan; `emit.ts`, `generate.ts`'s CLI option parser, and `GeneratorForm.tsx` each also hardcode the `devto`/`hashnode` pair and are unaffected since this plan does not add a `medium` generation-time option — only a publish-time one.
- [ ] Write the failing test at `packages/core/src/publishers/__tests__/medium.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import type { ArticleOutput } from "../../schema/index.js";

  const ensureLoggedInMock = vi.fn();
  const runBrowserHarnessScriptMock = vi.fn();
  const writePublishedTrackingRecordMock = vi.fn();

  vi.mock("../browser-harness-client.js", () => ({
    ensureLoggedIn: (...args: unknown[]) => ensureLoggedInMock(...args),
    runBrowserHarnessScript: (...args: unknown[]) => runBrowserHarnessScriptMock(...args),
  }));
  vi.mock("../published-tracking.js", () => ({
    writePublishedTrackingRecord: (...args: unknown[]) => writePublishedTrackingRecordMock(...args),
  }));

  import { publishToMedium } from "../medium.js";

  function makeArticle(overrides: Partial<ArticleOutput> = {}): ArticleOutput {
    return {
      slug: "how-dns-works",
      title: "How DNS Actually Works",
      summary: "A deep dive into DNS resolution.",
      date: "2026-09-09",
      tags: ["dns", "networking", "systems"],
      readingTime: 8,
      wordCount: 1600,
      tone: "senior",
      format: "explainer",
      length: "medium",
      category: "system-design",
      platforms: ["medium"],
      body: "## Intro\n\nDNS resolves names to IPs.\n\n## How it works\n\nRecursive resolvers ask root servers.",
      ...overrides,
    };
  }

  describe("publishToMedium", () => {
    beforeEach(() => {
      ensureLoggedInMock.mockReset();
      runBrowserHarnessScriptMock.mockReset();
      writePublishedTrackingRecordMock.mockReset();
    });

    it("throws when canonicalBase is not provided", async () => {
      await expect(
        publishToMedium(makeArticle(), { canonicalBase: "" } as never),
      ).rejects.toThrow(/requires opts.canonicalBase/);
      expect(ensureLoggedInMock).not.toHaveBeenCalled();
    });

    it("throws MediumContentValidationError when the body has H3 headings, before touching the browser", async () => {
      const article = makeArticle({ body: "## Intro\n\n### Sub-point\n\nBody text." });
      await expect(
        publishToMedium(article, { canonicalBase: "https://anvilry.vercel.app/notes" }),
      ).rejects.toThrow(/Line 3/);
      expect(ensureLoggedInMock).not.toHaveBeenCalled();
    });

    it("imports via medium.com/p/import and writes a draft tracking record on success", async () => {
      ensureLoggedInMock.mockResolvedValue(undefined);
      runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://medium.com/p/abc123def/edit" });

      const result = await publishToMedium(makeArticle(), {
        canonicalBase: "https://anvilry.vercel.app/notes",
        published: false,
      });

      expect(ensureLoggedInMock).toHaveBeenCalledWith("Medium", "https://medium.com/p/import");
      expect(result).toEqual({ id: "abc123def", url: "https://medium.com/p/abc123def/edit" });
      expect(writePublishedTrackingRecordMock).toHaveBeenCalledTimes(1);
      const [platform, record] = writePublishedTrackingRecordMock.mock.calls[0];
      expect(platform).toBe("medium");
      expect(record.status).toBe("draft");
      expect(record.canonicalUrl).toBe("https://anvilry.vercel.app/notes/how-dns-works");
    });

    it("throws a clear error when the import script reports failure", async () => {
      ensureLoggedInMock.mockResolvedValue(undefined);
      runBrowserHarnessScriptMock.mockResolvedValue({ status: "error", message: "Medium Import button not found" });

      await expect(
        publishToMedium(makeArticle(), { canonicalBase: "https://anvilry.vercel.app/notes" }),
      ).rejects.toThrow(/Import button not found/);
    });
  });
  ```
- [ ] Run it and confirm it fails: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/medium.test.ts` — expected failure: `Failed to resolve import "../medium.js"`.
- [ ] Write the minimal implementation at `packages/core/src/publishers/medium.ts`:
  ```ts
  import type { ArticleOutput } from "../schema/index.js";
  import { ensureLoggedIn, runBrowserHarnessScript } from "./browser-harness-client.js";
  import { validateForMedium, MediumContentValidationError } from "./medium-content-validator.js";
  import { writePublishedTrackingRecord } from "./published-tracking.js";

  export type MediumPublishResult = { id: string; url: string };

  const MEDIUM_IMPORT_URL = "https://medium.com/p/import";

  // Text-content element matching, not CSS selectors — Medium's exact DOM was
  // not live-verified in this repo's planning session (see plan Disclosed
  // limitation). Confirm against your own logged-in Chrome before relying on
  // this in production; adjust the regexes below if Medium's copy has changed.
  const MEDIUM_SCRIPT_BODY = `
  ensure_real_tab()
  result = {"status": "error", "message": "unknown failure"}
  try:
      found = js('''
          (() => {
            const el = document.querySelector('input[type="url"], input[placeholder*="URL" i], input[type="text"]');
            if (!el) return false;
            el.setAttribute('data-bh-target', 'import-url');
            return true;
          })()
      ''')
      if not found:
          result = {"status": "error", "message": "Medium import URL field not found - page layout may have changed"}
      else:
          fill_input('[data-bh-target="import-url"]', CANONICAL_URL)
          clicked = js('''
              (() => {
                const btn = [...document.querySelectorAll('button, a[role="button"]')]
                  .find(b => /import/i.test(b.textContent || ''));
                if (!btn) return false;
                const r = btn.getBoundingClientRect();
                window.__bh_click_target = [r.x + r.width / 2, r.y + r.height / 2];
                return true;
              })()
          ''')
          if not clicked:
              result = {"status": "error", "message": "Medium Import button not found"}
          else:
              x, y = js('window.__bh_click_target')
              click_at_xy(x, y)
              wait_for_load()
              wait(2)
              if PUBLISH_AFTER_IMPORT:
                  publish_clicked = js('''
                      (() => {
                        const btn = [...document.querySelectorAll('button, a[role="button"]')]
                          .find(b => /^publish/i.test((b.textContent || '').trim()));
                        if (!btn) return false;
                        const r = btn.getBoundingClientRect();
                        window.__bh_click_target = [r.x + r.width / 2, r.y + r.height / 2];
                        return true;
                      })()
                  ''')
                  if publish_clicked:
                      x, y = js('window.__bh_click_target')
                      click_at_xy(x, y)
                      wait(1)
                      confirm_clicked = js('''
                          (() => {
                            const btn = [...document.querySelectorAll('button')]
                              .find(b => /publish now/i.test((b.textContent || '').trim()));
                            if (!btn) return false;
                            const r = btn.getBoundingClientRect();
                            window.__bh_click_target = [r.x + r.width / 2, r.y + r.height / 2];
                            return true;
                          })()
                      ''')
                      if confirm_clicked:
                          x, y = js('window.__bh_click_target')
                          click_at_xy(x, y)
                          wait_for_load()
              info = page_info()
              result = {"status": "ok", "url": info["url"]}
  except Exception as e:
      result = {"status": "error", "message": str(e)}
  print(json.dumps(result))
  `.trim();

  /**
   * Publish to Medium via the "Import a story" flow (medium.com/p/import),
   * driven through browser-harness against the operator's own logged-in Chrome.
   * Deterministic scripted CDP automation — no LLM in the click path.
   *
   * Medium has no public content-submission API. The only supported path
   * (CLAUDE.md "Medium Publishing Rules", docs/publishing.md, verified
   * 2026-06-19) is: publish the canonical article on Anvilry first, then import
   * it into Medium from that live URL — Medium re-parses the live HTML page
   * itself, so opts.canonicalBase is REQUIRED here, unlike publishToDevto where
   * it is optional: there is no other content source Medium can import from.
   *
   * v1 scope: scripts the import + an optional "Publish" click. Does NOT script
   * Medium's Story Settings panel (tag chips, canonical-URL confirmation) — see
   * plan "Disclosed limitation". Left as a manual follow-up in the tracking note.
   *
   * SAFETY: never enters credentials, MFA codes, or handles login. If the
   * operator is not logged in to Medium, ensureLoggedIn() throws
   * LoginRequiredError before any further browser action.
   */
  export async function publishToMedium(
    article: ArticleOutput,
    opts: { published?: boolean; canonicalBase: string; force?: boolean },
  ): Promise<MediumPublishResult> {
    if (!opts?.canonicalBase) {
      throw new Error(
        "publishToMedium requires opts.canonicalBase — Medium imports from the live " +
          "canonical URL via medium.com/p/import; there is no other content source.",
      );
    }

    const warnings = validateForMedium(article.body);
    if (warnings.length > 0 && !opts.force) {
      throw new MediumContentValidationError(warnings);
    }

    const canonicalUrl = `${opts.canonicalBase.replace(/\/$/, "")}/${article.slug}`;

    await ensureLoggedIn("Medium", MEDIUM_IMPORT_URL);

    const script = [
      `CANONICAL_URL = ${JSON.stringify(canonicalUrl)}`,
      `PUBLISH_AFTER_IMPORT = ${opts.published ? "True" : "False"}`,
      MEDIUM_SCRIPT_BODY,
    ].join("\n");

    const scriptResult = await runBrowserHarnessScript(script);

    if (scriptResult.status !== "ok") {
      throw new Error(`Medium import failed: ${String(scriptResult.message ?? "unknown error")}`);
    }

    const importedUrl = String(scriptResult.url);
    const idMatch = importedUrl.match(/\/p\/([a-f0-9]+)/i);
    const id = idMatch ? idMatch[1] : article.slug;

    writePublishedTrackingRecord("medium", {
      slug: article.slug,
      title: article.title,
      publishedUrl: importedUrl,
      publishedDate: new Date().toISOString().slice(0, 10),
      canonicalUrl,
      status: opts.published ? "live" : "draft",
      notes:
        `Imported from ${canonicalUrl} via medium.com/p/import. ` +
        `Confirm canonical URL and tags (${article.tags.slice(0, 5).join(", ")}) in Story Settings — not scripted.`,
    });

    return { id, url: importedUrl };
  }
  ```
- [ ] Run it and confirm it passes: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/medium.test.ts` — expect `4 passed`. Then run the full suite once: `pnpm --filter @inkforge/core test` — expect all prior suites still green.
- [ ] Commit:
  ```bash
  git add packages/core/src/publishers/medium.ts packages/core/src/publishers/__tests__/medium.test.ts
  git commit -m "feat(core): add browser-harness-backed Medium publisher"
  ```

---

### Task 5: Rewrite Hashnode publisher (browser-driven)
**Files:**
- Modify: `packages/core/src/publishers/hashnode.ts` (full rewrite, currently lines 1–20)
- Test: `packages/core/src/publishers/__tests__/hashnode.test.ts` (new)

**Interfaces:**
- Consumes: `ensureLoggedIn`, `runBrowserHarnessScript` (Task 1); `writePublishedTrackingRecord` (Task 2); `ArticleOutput` (unchanged).
- Produces: `type HashnodePublishResult = { id: string; url: string }` (renamed from the current stub's identical-shaped type — no breaking change), `publishToHashnode(article: ArticleOutput, opts?: { published?: boolean; canonicalBase?: string; editorUrl?: string }): Promise<HashnodePublishResult>`. Signature is call-compatible with the existing stub (`packages/cli/src/commands/publish.ts` line 54 and `apps/web/src/app/api/publish/route.ts` line 38 currently call it the same way), so this is a drop-in replacement at the call sites Task 6 doesn't already remove.

- [ ] Write the failing test at `packages/core/src/publishers/__tests__/hashnode.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import type { ArticleOutput } from "../../schema/index.js";

  const ensureLoggedInMock = vi.fn();
  const runBrowserHarnessScriptMock = vi.fn();
  const writePublishedTrackingRecordMock = vi.fn();

  vi.mock("../browser-harness-client.js", () => ({
    ensureLoggedIn: (...args: unknown[]) => ensureLoggedInMock(...args),
    runBrowserHarnessScript: (...args: unknown[]) => runBrowserHarnessScriptMock(...args),
  }));
  vi.mock("../published-tracking.js", () => ({
    writePublishedTrackingRecord: (...args: unknown[]) => writePublishedTrackingRecordMock(...args),
  }));

  import { publishToHashnode } from "../hashnode.js";

  function makeArticle(overrides: Partial<ArticleOutput> = {}): ArticleOutput {
    return {
      slug: "how-dns-works",
      title: "How DNS Actually Works",
      summary: "A deep dive into DNS resolution.",
      date: "2026-09-09",
      tags: ["dns", "networking"],
      readingTime: 8,
      wordCount: 1600,
      tone: "senior",
      format: "explainer",
      length: "medium",
      category: "system-design",
      platforms: ["hashnode"],
      body: "## Intro\n\nDNS resolves names to IPs.",
      ...overrides,
    };
  }

  describe("publishToHashnode", () => {
    beforeEach(() => {
      ensureLoggedInMock.mockReset();
      runBrowserHarnessScriptMock.mockReset();
      writePublishedTrackingRecordMock.mockReset();
      delete process.env.HASHNODE_EDITOR_URL;
    });

    it("throws a config error when neither HASHNODE_EDITOR_URL nor opts.editorUrl is set", async () => {
      await expect(publishToHashnode(makeArticle())).rejects.toThrow(/HASHNODE_EDITOR_URL/);
      expect(ensureLoggedInMock).not.toHaveBeenCalled();
    });

    it("publishes via the configured editor URL and writes a draft tracking record", async () => {
      ensureLoggedInMock.mockResolvedValue(undefined);
      runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://sairam.hashnode.dev/how-dns-works" });

      const result = await publishToHashnode(makeArticle(), {
        editorUrl: "https://sairam.hashnode.dev/new",
        canonicalBase: "https://anvilry.vercel.app/notes",
      });

      expect(ensureLoggedInMock).toHaveBeenCalledWith("Hashnode", "https://sairam.hashnode.dev/new");
      expect(result).toEqual({ id: "how-dns-works", url: "https://sairam.hashnode.dev/how-dns-works" });
      const [platform, record] = writePublishedTrackingRecordMock.mock.calls[0];
      expect(platform).toBe("hashnode");
      expect(record.status).toBe("draft");
    });

    it("falls back to the HASHNODE_EDITOR_URL env var when opts.editorUrl is omitted", async () => {
      process.env.HASHNODE_EDITOR_URL = "https://sairam.hashnode.dev/new";
      ensureLoggedInMock.mockResolvedValue(undefined);
      runBrowserHarnessScriptMock.mockResolvedValue({ status: "ok", url: "https://sairam.hashnode.dev/how-dns-works" });

      await publishToHashnode(makeArticle());

      expect(ensureLoggedInMock).toHaveBeenCalledWith("Hashnode", "https://sairam.hashnode.dev/new");
    });

    it("throws a clear error when the publish script reports failure", async () => {
      ensureLoggedInMock.mockResolvedValue(undefined);
      runBrowserHarnessScriptMock.mockResolvedValue({ status: "error", message: "Hashnode body editor not found" });

      await expect(
        publishToHashnode(makeArticle(), { editorUrl: "https://sairam.hashnode.dev/new" }),
      ).rejects.toThrow(/body editor not found/);
    });
  });
  ```
- [ ] Run it and confirm it fails: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/hashnode.test.ts` — expected failure: `AssertionError: expected [Function] to reject` (the current stub in `hashnode.ts` always throws the same "API decommissioned" error regardless of args, so the second/third/fourth assertions fail against the un-rewritten file).
- [ ] Replace the entire contents of `packages/core/src/publishers/hashnode.ts` (all 20 current lines) with:
  ```ts
  import type { ArticleOutput } from "../schema/index.js";
  import { ensureLoggedIn, runBrowserHarnessScript } from "./browser-harness-client.js";
  import { writePublishedTrackingRecord } from "./published-tracking.js";

  export type HashnodePublishResult = { id: string; url: string };

  // Text-content element matching, not CSS selectors — Hashnode's exact editor
  // DOM was not live-verified in this repo's planning session. Confirm against
  // your own logged-in Chrome before relying on this in production.
  const HASHNODE_SCRIPT_BODY = `
  ensure_real_tab()
  result = {"status": "error", "message": "unknown failure"}
  try:
      fill_input('input[placeholder*="title" i], textarea[placeholder*="title" i]', TITLE, timeout=10.0)
      body_filled = js(f"""
          (() => {{
            const el = document.querySelector('[contenteditable="true"], .ProseMirror, textarea[placeholder*="markdown" i]');
            if (!el) return false;
            el.focus();
            document.execCommand('insertText', false, {json.dumps(BODY_MARKDOWN)});
            el.dispatchEvent(new Event('input', {{bubbles: true}}));
            return true;
          }})()
      """)
      if not body_filled:
          result = {"status": "error", "message": "Hashnode body editor not found - page layout may have changed"}
      else:
          if TAGS_TEXT:
              try:
                  fill_input('input[placeholder*="tag" i]', TAGS_TEXT, timeout=3.0)
                  press_key("Enter")
              except Exception:
                  pass  # tag field is best-effort; article still publishes without it
          if PUBLISH_AFTER_DRAFT:
              clicked = js("""
                  (() => {
                    const btn = [...document.querySelectorAll('button')]
                      .find(b => /^publish/i.test((b.textContent || '').trim()));
                    if (!btn) return false;
                    const r = btn.getBoundingClientRect();
                    window.__bh_click_target = [r.x + r.width / 2, r.y + r.height / 2];
                    return true;
                  })()
              """)
              if clicked:
                  x, y = js("window.__bh_click_target")
                  click_at_xy(x, y)
                  wait(1)
                  confirm_clicked = js("""
                      (() => {
                        const btn = [...document.querySelectorAll('button')]
                          .find(b => /^publish now|^confirm/i.test((b.textContent || '').trim()));
                        if (!btn) return false;
                        const r = btn.getBoundingClientRect();
                        window.__bh_click_target = [r.x + r.width / 2, r.y + r.height / 2];
                        return true;
                      })()
                  """)
                  if confirm_clicked:
                      x, y = js("window.__bh_click_target")
                      click_at_xy(x, y)
                      wait_for_load()
          info = page_info()
          result = {"status": "ok", "url": info["url"]}
  except Exception as e:
      result = {"status": "error", "message": str(e)}
  print(json.dumps(result))
  `.trim();

  /**
   * Publish to Hashnode via browser-harness against the operator's own
   * logged-in Chrome. Deterministic scripted CDP automation — no LLM.
   *
   * Hashnode's public GraphQL API (gql.hashnode.com) was decommissioned in
   * 2026 with no announced replacement (docs/publishing.md, verified 2026-06)
   * — browser automation is the only remaining publish path, same as Medium.
   *
   * Requires HASHNODE_EDITOR_URL (env var) or opts.editorUrl — Hashnode's
   * current "new post" URL scheme was not live-verified in this repo's
   * planning session, so it is not hardcoded here. Copy the URL from your own
   * browser's address bar while on your blog's "Write" screen and set it once.
   *
   * v1 scope: fills title + body, a best-effort tags fill, and an optional
   * "Publish" click. Does NOT script Hashnode's SEO-settings panel
   * (canonical-URL field) — see plan "Disclosed limitation". Left as a manual
   * follow-up in the tracking note.
   *
   * SAFETY: never enters credentials, MFA codes, or handles login. If the
   * operator is not logged in to Hashnode, ensureLoggedIn() throws
   * LoginRequiredError before any further browser action.
   */
  export async function publishToHashnode(
    article: ArticleOutput,
    opts?: { published?: boolean; canonicalBase?: string; editorUrl?: string },
  ): Promise<HashnodePublishResult> {
    const editorUrl = opts?.editorUrl ?? process.env.HASHNODE_EDITOR_URL;
    if (!editorUrl) {
      throw new Error(
        "publishToHashnode requires HASHNODE_EDITOR_URL (env var) or opts.editorUrl — " +
          'set it to your blog\'s "Write" screen URL, e.g. https://<you>.hashnode.dev/new.',
      );
    }

    const canonicalUrl = opts?.canonicalBase
      ? `${opts.canonicalBase.replace(/\/$/, "")}/${article.slug}`
      : undefined;
    const tags = article.tags.slice(0, 5);

    await ensureLoggedIn("Hashnode", editorUrl);

    const script = [
      `TITLE = ${JSON.stringify(article.title)}`,
      `BODY_MARKDOWN = ${JSON.stringify(article.body)}`,
      `TAGS_TEXT = ${JSON.stringify(tags.join(", "))}`,
      `PUBLISH_AFTER_DRAFT = ${opts?.published ? "True" : "False"}`,
      HASHNODE_SCRIPT_BODY,
    ].join("\n");

    const scriptResult = await runBrowserHarnessScript(script);

    if (scriptResult.status !== "ok") {
      throw new Error(`Hashnode publish failed: ${String(scriptResult.message ?? "unknown error")}`);
    }

    const finalUrl = String(scriptResult.url);
    const id = article.slug;

    writePublishedTrackingRecord("hashnode", {
      slug: article.slug,
      title: article.title,
      publishedUrl: finalUrl,
      publishedDate: new Date().toISOString().slice(0, 10),
      canonicalUrl,
      status: opts?.published ? "live" : "draft",
      notes:
        "Set canonical URL manually in Hashnode's SEO settings panel if not already set — " +
        "the settings-panel click path was not live-verified and is not scripted.",
    });

    return { id, url: finalUrl };
  }
  ```
- [ ] Run it and confirm it passes: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/hashnode.test.ts` — expect `4 passed`. Then `pnpm --filter @inkforge/core test` for the whole package — expect all suites green.
- [ ] Commit:
  ```bash
  git add packages/core/src/publishers/hashnode.ts packages/core/src/publishers/__tests__/hashnode.test.ts
  git commit -m "feat(core): rewrite Hashnode publisher as browser-harness automation

  Hashnode's public GraphQL API was decommissioned in 2026 with no replacement;
  this replaces the always-throwing stub with real CDP automation against the
  operator's own logged-in Chrome, matching the Medium publisher's approach."
  ```

---

### Task 6: Wire Medium/Hashnode into the CLI via a shared registry; block them from the web app
**Files:**
- Create: `packages/core/src/publishers/registry.ts`
- Test: `packages/core/src/publishers/__tests__/registry.test.ts`
- Modify: `packages/core/package.json` (lines 8–21, `exports` map)
- Modify: `packages/cli/src/commands/publish.ts` (lines 10, 36, 42–65)
- Modify: `apps/web/src/app/api/publish/route.ts` (lines 1–2, 25–41)

**Interfaces:**
- Consumes: nothing from earlier tasks directly, but its registry entries point at Task 4's `publishToMedium` and Task 5's `publishToHashnode` module paths.
- Produces: `type PublisherRegistryEntry = { modulePath: string; exportName: string }`, `resolvePublisher(platform: string): PublisherRegistryEntry`, `supportedPlatforms(): string[]`. Consumed by `packages/cli/src/commands/publish.ts`.

- [ ] Write the failing test at `packages/core/src/publishers/__tests__/registry.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { resolvePublisher, supportedPlatforms } from "../registry.js";

  describe("resolvePublisher", () => {
    it("resolves devto", () => {
      expect(resolvePublisher("devto")).toEqual({
        modulePath: "@inkforge/core/publishers/devto",
        exportName: "publishToDevto",
      });
    });
    it("resolves medium", () => {
      expect(resolvePublisher("medium")).toEqual({
        modulePath: "@inkforge/core/publishers/medium",
        exportName: "publishToMedium",
      });
    });
    it("resolves hashnode", () => {
      expect(resolvePublisher("hashnode")).toEqual({
        modulePath: "@inkforge/core/publishers/hashnode",
        exportName: "publishToHashnode",
      });
    });
    it("throws a clear error listing supported platforms for an unknown platform", () => {
      expect(() => resolvePublisher("substack")).toThrow(/Unknown platform: substack.*devto.*hashnode.*medium/s);
    });
  });

  describe("supportedPlatforms", () => {
    it("lists all three registered platforms", () => {
      expect(supportedPlatforms().sort()).toEqual(["devto", "hashnode", "medium"]);
    });
  });
  ```
- [ ] Run it and confirm it fails: `pnpm --filter @inkforge/core test -- src/publishers/__tests__/registry.test.ts` — expected failure: `Failed to resolve import "../registry.js"`.
- [ ] Write the minimal implementation at `packages/core/src/publishers/registry.ts`:
  ```ts
  export type PublisherRegistryEntry = { modulePath: string; exportName: string };

  const PUBLISHER_REGISTRY: Record<string, PublisherRegistryEntry> = {
    devto: { modulePath: "@inkforge/core/publishers/devto", exportName: "publishToDevto" },
    hashnode: { modulePath: "@inkforge/core/publishers/hashnode", exportName: "publishToHashnode" },
    medium: { modulePath: "@inkforge/core/publishers/medium", exportName: "publishToMedium" },
  };

  export function resolvePublisher(platform: string): PublisherRegistryEntry {
    const entry = PUBLISHER_REGISTRY[platform];
    if (!entry) {
      throw new Error(
        `Unknown platform: ${platform}. Supported platforms: ${Object.keys(PUBLISHER_REGISTRY).sort().join(", ")}`,
      );
    }
    return entry;
  }

  export function supportedPlatforms(): string[] {
    return Object.keys(PUBLISHER_REGISTRY);
  }
  ```
  Then update `packages/core/package.json` lines 8–21 (the `exports` map) from:
  ```json
    "exports": {
      ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts"
      },
      "./publishers/devto": {
        "import": "./dist/publishers/devto.js",
        "types": "./dist/publishers/devto.d.ts"
      },
      "./publishers/hashnode": {
        "import": "./dist/publishers/hashnode.js",
        "types": "./dist/publishers/hashnode.d.ts"
      }
    },
  ```
  to:
  ```json
    "exports": {
      ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts"
      },
      "./publishers/devto": {
        "import": "./dist/publishers/devto.js",
        "types": "./dist/publishers/devto.d.ts"
      },
      "./publishers/hashnode": {
        "import": "./dist/publishers/hashnode.js",
        "types": "./dist/publishers/hashnode.d.ts"
      },
      "./publishers/medium": {
        "import": "./dist/publishers/medium.js",
        "types": "./dist/publishers/medium.d.ts"
      },
      "./publishers/registry": {
        "import": "./dist/publishers/registry.js",
        "types": "./dist/publishers/registry.d.ts"
      }
    },
  ```
  Then update `packages/cli/src/commands/publish.ts`. Line 10's option description, from:
  ```ts
      .option("--platform <platforms...>", "Platforms: devto hashnode")
  ```
  to:
  ```ts
      .option("--platform <platforms...>", "Platforms: devto hashnode medium")
  ```
  Line 36's error message, from:
  ```ts
        console.error(chalk.red("✗ Specify at least one --platform devto|hashnode"));
  ```
  to:
  ```ts
        console.error(chalk.red("✗ Specify at least one --platform devto|hashnode|medium"));
  ```
  And lines 42–65 (the whole `for` loop), from:
  ```ts
        for (const platform of platforms) {
          const spinner = ora(`Publishing to ${platform}…`).start();
          try {
            if (platform === "devto") {
              const { publishToDevto } = await import("@inkforge/core/publishers/devto");
              const result = await publishToDevto(article as Parameters<typeof publishToDevto>[0], {
                published: opts.published ?? false,
                canonicalBase: opts.canonicalBase,
              });
              spinner.succeed(chalk.green(`Dev.to: ${result.url}`));
            } else if (platform === "hashnode") {
              const { publishToHashnode } = await import("@inkforge/core/publishers/hashnode");
              const result = await publishToHashnode(article as Parameters<typeof publishToHashnode>[0], {
                published: opts.published ?? false,
                canonicalBase: opts.canonicalBase,
              });
              spinner.succeed(chalk.green(`Hashnode: ${result.url}`));
            } else {
              spinner.fail(chalk.yellow(`Unknown platform: ${platform}`));
            }
          } catch (err) {
            spinner.fail(chalk.red(`${platform}: ${err instanceof Error ? err.message : String(err)}`));
          }
        }
  ```
  to:
  ```ts
        const { resolvePublisher } = await import("@inkforge/core/publishers/registry");

        for (const platform of platforms) {
          const spinner = ora(`Publishing to ${platform}…`).start();
          try {
            const { modulePath, exportName } = resolvePublisher(platform);
            const mod = (await import(modulePath)) as Record<
              string,
              (article: unknown, opts: unknown) => Promise<{ url: string }>
            >;
            const publishFn = mod[exportName];
            const result = await publishFn(article, {
              published: opts.published ?? false,
              canonicalBase: opts.canonicalBase,
            });
            spinner.succeed(chalk.green(`${platform}: ${result.url}`));
          } catch (err) {
            spinner.fail(chalk.red(`${platform}: ${err instanceof Error ? err.message : String(err)}`));
          }
        }
  ```
  Then update `apps/web/src/app/api/publish/route.ts` (Global Constraint: browser-harness needs the operator's local Chrome, so Medium/Hashnode must never run from this deployed route). Lines 1–2, from:
  ```ts
  import { publishToDevto } from "@inkforge/core/publishers/devto";
  import { publishToHashnode } from "@inkforge/core/publishers/hashnode";
  ```
  to:
  ```ts
  import { publishToDevto } from "@inkforge/core/publishers/devto";
  ```
  And lines 25–41 (the `POST` handler up through the platform dispatch), from:
  ```ts
  export async function POST(req: Request) {
    const { slug, platform, published = false } = await req.json() as { slug: string; platform: string; published?: boolean };
    const path = resolve(contentDir(), `${slug}.mdx`);
    if (!existsSync(path)) return Response.json({ error: "Article not found" }, { status: 404 });

    const article = parseArticle(readFileSync(path, "utf-8"));
    const opts = { published, canonicalBase: canonicalBase() };

    try {
      let result: { url: string };
      if (platform === "devto") {
        result = await publishToDevto(article as Parameters<typeof publishToDevto>[0], opts);
      } else if (platform === "hashnode") {
        result = await publishToHashnode(article as Parameters<typeof publishToHashnode>[0], opts);
      } else {
        return Response.json({ error: "Unknown platform" }, { status: 400 });
      }
  ```
  to:
  ```ts
  const LOCAL_ONLY_PLATFORMS = new Set(["medium", "hashnode"]);

  export async function POST(req: Request) {
    const { slug, platform, published = false } = await req.json() as { slug: string; platform: string; published?: boolean };

    if (LOCAL_ONLY_PLATFORMS.has(platform)) {
      return Response.json(
        {
          error:
            `${platform} publishing drives your own logged-in Chrome via browser-harness and only runs from the ` +
            `Inkforge CLI on your machine — run: inkforge publish --slug ${slug} --platform ${platform}`,
        },
        { status: 400 },
      );
    }

    const path = resolve(contentDir(), `${slug}.mdx`);
    if (!existsSync(path)) return Response.json({ error: "Article not found" }, { status: 404 });

    const article = parseArticle(readFileSync(path, "utf-8"));
    const opts = { published, canonicalBase: canonicalBase() };

    try {
      let result: { url: string };
      if (platform === "devto") {
        result = await publishToDevto(article as Parameters<typeof publishToDevto>[0], opts);
      } else {
        return Response.json({ error: "Unknown platform" }, { status: 400 });
      }
  ```
  (the remaining `return Response.json({ url: result.url });` / `catch` block at the end of the function is unchanged).
- [ ] Run it and confirm it passes:
  - `pnpm --filter @inkforge/core test -- src/publishers/__tests__/registry.test.ts` — expect `5 passed`.
  - `pnpm --filter @inkforge/core test` — expect the full core suite green (all publisher tests + existing `ingest`/`chunker` tests).
  - `pnpm --filter @inkforge/core build && pnpm --filter @inkforge/cli typecheck && pnpm --filter @inkforge/web typecheck` — expect all three to exit 0 (this is the closest thing to a "test" for the CLI/web glue code, since neither package has a test runner configured today).
- [ ] Commit:
  ```bash
  git add packages/core/src/publishers/registry.ts packages/core/src/publishers/__tests__/registry.test.ts packages/core/package.json packages/cli/src/commands/publish.ts apps/web/src/app/api/publish/route.ts
  git commit -m "feat(cli): wire medium/hashnode publishers through a shared registry

  Also blocks medium/hashnode from apps/web's publish API route — browser-harness
  drives the operator's local Chrome and has no meaning in a deployed context."
  ```

---

### Task 7: Env template and doc sync
**Files:**
- Modify: `.env.example` (lines 16–19)
- Modify: `docs/publishing.md` (lines 5–12, 33–58, 84–96)
- Modify: `CLAUDE.md` (lines 137–145)

**Interfaces:** none (no code contract) — this task exists so the docs this feature's own research relied on don't go stale the moment this ships (an engineer six months from now must not read `docs/publishing.md` and conclude Hashnode is still "manual paste only").

- [ ] Write the failing test — a shell assertion that the stale claims are still present (i.e. this genuinely fails against the current repo):
  ```bash
  grep -q "browser-harness" /Users/sairamugge/Desktop/Not-Humans-World/Inkforge/docs/publishing.md && echo "FOUND" || echo "NOT FOUND YET"
  ```
- [ ] Run it and confirm it fails: run the command above — expected output: `NOT FOUND YET` (the string "browser-harness" does not appear anywhere in `docs/publishing.md` before this task).
- [ ] Make the doc edits:
  - `.env.example` lines 16–19, from:
    ```
    # Publishing
    DEVTO_API_KEY=
    HASHNODE_API_KEY=
    HASHNODE_PUBLICATION_ID=
    ```
    to:
    ```
    # Publishing
    DEVTO_API_KEY=
    HASHNODE_API_KEY=
    HASHNODE_PUBLICATION_ID=
    HASHNODE_EDITOR_URL=
    BROWSER_HARNESS_BIN=browser-harness
    ```
  - `docs/publishing.md` lines 5–12 (the "Supported Platforms" table), from:
    ```
    | Platform | Method | API Support | Notes |
    |---|---|---|---|
    | **sairam.dev (Anvilry)** | Auto-mirror on generate | ✅ Native | Velite picks up `.md` + `.mdx` on `pnpm content` |
    | **Dev.to** | `inkforge publish --platform devto` | ✅ REST API | Requires `DEVTO_API_KEY` |
    | **Hashnode** | Manual paste | ❌ API decommissioned (2026-06) | `gql.hashnode.com` shut down — no replacement API yet |
    | **Medium** | Manual paste via `medium.com/p/import` | ❌ Deprecated | Import from URL preserves formatting |
    | **Substack** | Manual paste | ❌ No API | Add attribution line at bottom |
    | **LinkedIn** | Manual upload (PDF carousel) | ❌ No public API | Use generated `linkedin-carousel-*.pdf` |
    ```
    to:
    ```
    | Platform | Method | API Support | Notes |
    |---|---|---|---|
    | **sairam.dev (Anvilry)** | Auto-mirror on generate | ✅ Native | Velite picks up `.md` + `.mdx` on `pnpm content` |
    | **Dev.to** | `inkforge publish --platform devto` | ✅ REST API | Requires `DEVTO_API_KEY` |
    | **Hashnode** | `inkforge publish --platform hashnode` | ❌ API decommissioned (2026-06) | browser-harness automation against your own logged-in Chrome — requires `HASHNODE_EDITOR_URL`; manual fallback below |
    | **Medium** | `inkforge publish --platform medium` | ❌ No public API | browser-harness automation via `medium.com/p/import` against your own logged-in Chrome; manual fallback below |
    | **Substack** | Manual paste | ❌ No API | Add attribution line at bottom |
    | **LinkedIn** | Manual upload (PDF carousel) | ❌ No public API | Use generated `linkedin-carousel-*.pdf` |
    ```
  - `docs/publishing.md` lines 33–58 (Medium section) and 84–96 (Hashnode section): prepend an "Automated (recommended)" subsection above the existing "Import from URL" / "Manual workflow" instructions (kept as-is below, since they remain the correct fallback when Chrome/browser-harness is unavailable), e.g. for Medium insert directly after the `## Medium Publishing Rules` heading:
    ```markdown
    **Automated (recommended):** `inkforge publish --slug your-slug --platform medium --canonical-base https://anvilry.vercel.app/notes`
    Drives your own logged-in Chrome via `browser-harness` — never touches your password. If you are not logged in to Medium, it stops and tells you to log in yourself. Scripts the import + Publish click; canonical URL/tags in Story Settings still need a manual check (recorded in the tracking note it writes to `content/published/medium/<slug>.md`).
    ```
    and for Hashnode, directly after the `## Hashnode Publishing Rules` heading:
    ```markdown
    **Automated (recommended):** set `HASHNODE_EDITOR_URL` in `.env` to your blog's "Write" screen URL once, then `inkforge publish --slug your-slug --platform hashnode`.
    Drives your own logged-in Chrome via `browser-harness` — never touches your password. If you are not logged in to Hashnode, it stops and tells you to log in yourself. Canonical URL in SEO settings still needs a manual check (recorded in the tracking note it writes to `content/published/hashnode/<slug>.md`).
    ```
  - `CLAUDE.md` lines 137–145 (Dev.to + Hashnode rule blocks): after the existing `## Hashnode Publishing Rules` bullets, add:
    ```markdown
    - Automated via `inkforge publish --platform hashnode` (browser-harness, requires `HASHNODE_EDITOR_URL` in `.env` and an already-logged-in Chrome) — see docs/publishing.md
    ```
    and after the existing `## Medium Publishing Rules` bullets (before the "Checklist" section), add:
    ```markdown
    - Automated via `inkforge publish --platform medium --canonical-base <url>` (browser-harness, requires an already-logged-in Chrome; `--canonical-base` is required for Medium, unlike Dev.to/Hashnode) — see docs/publishing.md
    ```
- [ ] Run it and confirm it passes: `grep -q "browser-harness" /Users/sairamugge/Desktop/Not-Humans-World/Inkforge/docs/publishing.md && echo "FOUND" || echo "NOT FOUND YET"` — expected output: `FOUND`.
- [ ] Commit:
  ```bash
  git add .env.example docs/publishing.md CLAUDE.md
  git commit -m "docs: document the browser-harness-backed medium/hashnode publish flow"
  ```

---

## Self-Review

- **Requirement coverage:** login-wall safety (Task 1 + Global Constraints + baked into Task 4/5 via `ensureLoggedIn`), Medium editor constraints from the user's `medium-publishing` skill (H3/tables — Task 3, cross-checked against `~/.claude/skills/medium-publishing` and `CLAUDE.md`/`docs/publishing.md`, all three agree: no H3, no tables, 1400×787 cover, canonical via Story Settings, 5-tag cap), matching `publishToDevto`'s signature (Task 4/5 explicit doc comments + Task 6 registry), `hashnode.ts` current state read in full and correctly characterized as a deliberate stub not a broken file (Task 5), Playwright/browser-harness redundancy question answered with a concrete recommendation backed by a repo-wide grep (Spec table), content-transformation gap vs. `publishToDevto` identified and implemented as `validateForMedium` (Task 3), test conventions established since none existed for network/browser code (Tasks 1–6, all using this repo's existing Vitest + `describe/it/expect` style).
- **Placeholder scan:** no "TBD", no "add appropriate error handling", no "similar to Task N" — every task's code is complete and specific to this feature. The one deliberate scope cut (Story Settings / SEO-settings panels not scripted) is not a placeholder; it's a disclosed, tested boundary (the publisher still returns a valid draft URL and records the follow-up in the tracking note, verified by the "draft" status assertions in Task 4/5 tests).
- **Signature/type consistency:** `ArticleOutput` imported identically in Tasks 4 and 5 from `../schema/index.js` (verified against the real `packages/core/src/schema/index.ts` fields: `slug, title, summary, date, tags, readingTime, wordCount, tone, format, length, category, platforms, body` — the test fixtures in Task 4/5 use exactly these fields). Verifying against the real `PlatformSchema` field (`z.enum(["devto", "hashnode"])`) surfaced that it does not include `"medium"`, so Task 4 now includes an explicit step to extend it to `z.enum(["devto", "hashnode", "medium"])` before the test fixture's `platforms: ["medium"]` will type-check. `MediumPublishResult`/`HashnodePublishResult` both `{ id: string; url: string }`, matching `DevtoPublishResult` in the untouched `devto.ts`. `resolvePublisher`'s `exportName` values (`publishToDevto`/`publishToHashnode`/`publishToMedium`) match the actual exported function names defined in Tasks 4/5 and the pre-existing `devto.ts`. Task 6's `packages/core/package.json` exports additions (`./publishers/medium`, `./publishers/registry`) follow the exact existing pattern for `./publishers/devto`/`./publishers/hashnode`.
