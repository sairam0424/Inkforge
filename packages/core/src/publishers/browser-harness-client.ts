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
