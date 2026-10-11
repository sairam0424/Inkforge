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
