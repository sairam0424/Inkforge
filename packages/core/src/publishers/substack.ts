/**
 * Substack publisher stub.
 *
 * Substack does NOT expose a developer publish API as of 2026 (confirmed by
 * deep-research: no primary-source evidence of a publish endpoint survived
 * adversarial verification). This stub exists to give a clear error message
 * rather than a cryptic failure.
 *
 * Workaround: Export the MDX body as markdown and paste into Substack's editor.
 */
export function publishToSubstack(): never {
  throw new Error(
    "Substack does not expose a developer publish API. " +
    "To publish: copy the article body from the generated MDX file and paste into Substack's editor."
  );
}
