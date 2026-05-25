/**
 * Scrapes all Leader cards from https://en.onepiece-cardgame.com/cardlist/
 * Output: prisma/seed-leaders.json
 *
 * Usage:  npm run scrape:leaders
 *
 * Notes:
 *  - The site is JS-rendered. Filters are applied client-side.
 *  - Leader cards have IDs in the form "ST01-001" / "OP01-001".
 *  - Strategy: pick "Leader" category, "All" collection, click search, then walk pages.
 *  - If the filter selectors change, adjust the selectors in this script.
 */
import { chromium, type Page } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

const URL = "https://en.onepiece-cardgame.com/cardlist/";
const OUT_FILE = path.join(process.cwd(), "prisma", "seed-leaders.json");

type ScrapedLeader = {
  id: string;
  name: string;
  colors: string[];
  life: number | null;
  power: number | null;
  attribute: string | null;
  tribe: string | null;
  imageUrl: string;
};

async function tryClick(page: Page, selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      try {
        await loc.click({ timeout: 1500 });
        return true;
      } catch {
        // try next
      }
    }
  }
  return false;
}

async function extractCards(page: Page): Promise<ScrapedLeader[]> {
  // The cardlist renders cards within "modalCol" or list nodes; we try several layouts.
  return await page.evaluate(() => {
    const results: ScrapedLeader[] = [];
    // Candidate selectors observed across versions of the site.
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".resultCol, .modalCol, .cardListResult dl, .resultlist .card"
      )
    );
    for (const n of nodes) {
      const idEl = n.querySelector(".cardName, .infoCol, .cardNo, .number");
      const nameEl = n.querySelector(".cardName .name, .cardName, h4, .name");
      const imgEl = n.querySelector<HTMLImageElement>("img");
      if (!idEl || !imgEl) continue;

      const rawText = (n.textContent ?? "").replace(/\s+/g, " ").trim();
      const idMatch = rawText.match(/\b([A-Z]{2,4}\d{2,3}-\d{3})\b/);
      const id = idMatch?.[1] ?? null;
      if (!id) continue;

      const name = (nameEl?.textContent ?? id).trim();

      // Best effort attribute parsing from data-* or visible text labels.
      const getLabel = (label: string): string | null => {
        const m = rawText.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^|\\n]+?)(?=\\s*(Life|Power|Counter|Attribute|Color|Type|Trigger|$))`, "i"));
        return m ? m[1].trim() : null;
      };

      const life   = parseInt(getLabel("Life") ?? "", 10);
      const power  = parseInt(getLabel("Power") ?? "", 10);
      const attribute = getLabel("Attribute");
      const tribe = getLabel("Type");
      const colorTxt = getLabel("Color") ?? "";
      const colors = colorTxt
        .split(/[\/,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      let imageUrl = imgEl.src || imgEl.getAttribute("data-src") || "";
      if (imageUrl.startsWith("/")) imageUrl = `https://en.onepiece-cardgame.com${imageUrl}`;

      results.push({
        id,
        name,
        colors,
        life:  Number.isFinite(life)  ? life  : null,
        power: Number.isFinite(power) ? power : null,
        attribute,
        tribe,
        imageUrl,
      });
    }
    return results;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36",
  });
  const page = await context.newPage();
  console.log("Opening cardlist...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Cookie banner — best effort
  await tryClick(page, [
    'button:has-text("Accept")',
    'button:has-text("AGREE")',
    'button:has-text("Acepto")',
    '.cookie-accept',
  ]);

  // Try to open the filter panel if collapsed.
  await tryClick(page, ['button:has-text("Search")', '.searchBtn', '.btn-search']);

  // Card type → Leader
  const leaderClicked = await tryClick(page, [
    'label:has-text("Leader") input',
    'input[name="category[]"][value="LEADER"]',
    'input[name="category"][value="LEADER"]',
    'label:has-text("LEADER")',
  ]);
  console.log("Leader filter applied:", leaderClicked);

  // Submit search
  await tryClick(page, [
    'button:has-text("SEARCH")',
    'button:has-text("Search")',
    '.btn-search',
    '#searchBtn',
  ]);

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const all = new Map<string, ScrapedLeader>();
  let safety = 30; // up to 30 pages

  while (safety-- > 0) {
    const batch = await extractCards(page);
    console.log(`Page batch: ${batch.length} cards`);
    for (const c of batch) all.set(c.id, c);

    const nextBtn = page
      .locator('a:has-text("NEXT"), a:has-text("Next"), .next:not(.disabled) a, .pagination .next:not(.disabled)')
      .first();
    if (!(await nextBtn.count())) break;
    const disabled = await nextBtn.getAttribute("aria-disabled");
    if (disabled === "true") break;
    try {
      await nextBtn.click({ timeout: 2000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1200);
    } catch {
      break;
    }
  }

  const list = Array.from(all.values()).sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf-8");
  console.log(`Wrote ${list.length} leaders to ${OUT_FILE}`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
