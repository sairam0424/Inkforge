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
        publish_ok = True
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
            if not clicked:
                publish_ok = False
                result = {"status": "error", "message": "Hashnode Publish button not found - article was saved as a draft but NOT published"}
            else:
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
                if not confirm_clicked:
                    publish_ok = False
                    result = {"status": "error", "message": "Hashnode publish confirm button not found after clicking Publish - article was saved as a draft but NOT published"}
                else:
                    x, y = js("window.__bh_click_target")
                    click_at_xy(x, y)
                    wait_for_load()
        if publish_ok:
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
