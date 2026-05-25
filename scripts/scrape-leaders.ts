/**
 * Scrapes all Leader cards from https://en.onepiece-cardgame.com/cardlist/
 * Output: prisma/seed-leaders.json
 *
 * Strategy:
 *  1. Open cardlist, apply "Leader" filter, submit search.
 *  2. Trigger image lazy-loading by scrolling.
 *  3. Extract from DOM, then filter to entries that have a Life value
 *     (only Leaders carry a Life stat in OP TCG).
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
      try { await loc.click({ timeout: 1500 }); return true; } catch {}
    }
  }
  return false;
}

async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let prev = -1;
    for (let i = 0; i < 30; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(250);
      const h = document.body.scrollHeight;
      if (h === prev) break;
      prev = h;
    }
    window.scrollTo(0, 0);
    await sleep(200);
  });
}

async function extractCards(page: Page): Promise<ScrapedLeader[]> {
  return await page.evaluate(() => {
    function cleanColors(raw: string): string[] {
      return raw
        .replace(/Block\s*icon\s*\d*/gi, "")
        .split(/[\/,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    function field(text: string, label: string): string | null {
      const re = new RegExp(`${label}\\s*([^|\\n]*?)(?=\\s*(Life|Power|Counter|Attribute|Color|Card type|Card Type|Block icon|Type|Trigger|Feature|Effect|$))`, "i");
      const m = text.match(re);
      return m ? m[1].trim() : null;
    }
    function imgSrc(el: HTMLElement | null): string {
      if (!el) return "";
      const img = el.querySelector("img");
      if (!img) return "";
      const ds = img.getAttribute("data-src");
      const s  = img.getAttribute("src") ?? "";
      const pick = (ds && !ds.includes("dummy")) ? ds : s;
      if (!pick) return "";
      if (pick.startsWith("http")) return pick;
      try { return new URL(pick, location.href).toString(); } catch { return pick; }
    }

    const out: ScrapedLeader[] = [];
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(".resultCol, .modalCol, .cardListResult dl, .cardList dl")
    );
    for (const n of nodes) {
      const rawText = (n.textContent ?? "").replace(/\s+/g, " ").trim();
      const idMatch = rawText.match(/\b([A-Z]{2,4}\d{2,3}-\d{3})\b/);
      if (!idMatch) continue;
      const id = idMatch[1];

      const nameEl = n.querySelector(".cardName, h4, .name");
      const name = (nameEl?.textContent ?? id).replace(/\s+/g, " ").trim();

      // The page renders the type between pipes: "EB04-001 | L | LEADER NAME"
      const typeMatch = rawText.match(/\|\s*[A-Z]+\s*\|\s*([A-Z]+)\b/);
      const cardType = typeMatch?.[1] ?? "";
      if (cardType !== "LEADER") continue;

      const lifeTxt   = field(rawText, "Life");
      const powerTxt  = field(rawText, "Power");
      const colorTxt  = field(rawText, "Color") ?? "";
      const attribute = field(rawText, "Attribute");
      const tribeRaw  = field(rawText, "Type");

      const life  = lifeTxt  && /-?\d+/.test(lifeTxt)  ? parseInt(lifeTxt.match(/-?\d+/)![0], 10)  : null;
      const power = powerTxt && /-?\d+/.test(powerTxt) ? parseInt(powerTxt.match(/-?\d+/)![0], 10) : null;
      const tribe = tribeRaw ? tribeRaw.split(/\s+Effect/i)[0].trim() : null;

      out.push({
        id,
        name,
        colors: cleanColors(colorTxt),
        life,
        power,
        attribute,
        tribe,
        imageUrl: imgSrc(n),
      });
    }
    return out;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36",
    viewport: { width: 1400, height: 900 },
  });
  await context.addInitScript(() => {
    // @ts-expect-error - shim for tsx-transpiled code in browser context
    if (!globalThis.__name) globalThis.__name = (t: unknown) => t;
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    const t = msg.text();
    if (t.startsWith("DEBUG_") || t.startsWith("FORM_") || t.startsWith("SEARCH_")) console.log(t);
  });

  console.log("Opening cardlist...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  await tryClick(page, [
    'button:has-text("Accept")', 'button:has-text("AGREE")', '.cookie-accept',
  ]);

  // Reset series to "All" (empty value) and check the Leader category, then submit form
  const setupResult = await page.evaluate(() => {
    const seriesSel = document.querySelector<HTMLSelectElement>('select[name="series"]');
    if (seriesSel) seriesSel.value = "";

    const cats = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="categories[]"]'));
    const leader = cats.find((c) => c.value === "Leader");
    if (leader && !leader.checked) leader.click();

    // Try to find the form and submit
    const form = (leader ?? seriesSel)?.closest("form") as HTMLFormElement | null;
    if (form) { form.submit(); return { ok: true, via: "form.submit" }; }

    // Fallback: click any button labeled Search
    const btn = Array.from(document.querySelectorAll<HTMLElement>('button, input[type="submit"], a'))
      .find((el) => /^\s*(search|検索)\s*$/i.test(el.textContent ?? (el as HTMLInputElement).value ?? ""));
    if (btn) { btn.click(); return { ok: true, via: "button.click", text: btn.textContent }; }

    return { ok: false };
  });
  console.log("SEARCH_TRIGGER", JSON.stringify(setupResult));

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const collected = new Map<string, ScrapedLeader>();
  let safety = 30;

  while (safety-- > 0) {
    await scrollToBottom(page);
    await page.waitForTimeout(500);

    const batch = await extractCards(page);
    console.log(`Page batch: ${batch.length} cards`);
    for (const c of batch) {
      // Only Leaders carry a Life stat
      if (c.life === null || c.life === undefined) continue;
      collected.set(c.id, c);
    }

    const nextBtn = page.locator('a:has-text("NEXT"), a:has-text("Next"), .next:not(.disabled) a').first();
    if (!(await nextBtn.count())) break;
    const aria = await nextBtn.getAttribute("aria-disabled");
    if (aria === "true") break;
    try {
      await nextBtn.click({ timeout: 2000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1200);
    } catch { break; }
  }

  const list = Array.from(collected.values()).sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf-8");
  console.log(`Wrote ${list.length} leaders to ${OUT_FILE}`);

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
