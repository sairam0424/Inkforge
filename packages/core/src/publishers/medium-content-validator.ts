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
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);
    const isSeparatorRow = /^\s*\|[\s:|-]+\|\s*$/.test(nextLine) && nextLine.includes("-");
    if (isTableRow && isSeparatorRow) {
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
