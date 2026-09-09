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
            publish_ok = True
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
                if not publish_clicked:
                    publish_ok = False
                    result = {"status": "error", "message": "Medium Publish button not found after import - article was imported as a draft but NOT published"}
                else:
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
                    if not confirm_clicked:
                        publish_ok = False
                        result = {"status": "error", "message": "Medium 'Publish now' confirm button not found after clicking Publish - article was imported as a draft but NOT published"}
                    else:
                        x, y = js('window.__bh_click_target')
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
