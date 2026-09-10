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
