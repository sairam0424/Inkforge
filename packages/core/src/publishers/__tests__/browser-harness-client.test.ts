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
