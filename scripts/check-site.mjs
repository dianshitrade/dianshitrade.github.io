import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const htmlFiles = readdirSync(root).filter((file) => extname(file) === ".html");
const titles = new Map();
const descriptions = new Map();
const failures = [];
const htmlByFile = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), "utf8");
  htmlByFile.set(file, html);
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];

  if (h1Count !== 1) failures.push(`${file}: expected one h1, found ${h1Count}`);
  if (!title) failures.push(`${file}: missing title`);
  if (!description) failures.push(`${file}: missing meta description`);
  if (!canonical) failures.push(`${file}: missing canonical`);
  const isPromoPage = html.includes("data-promo-page");
  if (!html.includes(isPromoPage ? "assets/promo.css" : "assets/styles.css")) failures.push(`${file}: missing stylesheet`);
  if (!html.includes(isPromoPage ? "assets/promo.js" : "assets/site.js")) failures.push(`${file}: missing site script`);

  if (title) {
    if (titles.has(title)) failures.push(`${file}: duplicate title with ${titles.get(title)}`);
    titles.set(title, file);
  }

  if (description) {
    if (descriptions.has(description)) failures.push(`${file}: duplicate description with ${descriptions.get(description)}`);
    descriptions.set(description, file);
  }
}

const dataJs = readFileSync(join(root, "assets/data.js"), "utf8");
const postCount = (dataJs.match(/\{ title:/g) || []).length ||
  (dataJs.match(/\["[^"]+", "[^"]+", "[^"]+", "[^"]+"\]/g) || []).length;
if (postCount < 20) failures.push(`assets/data.js: expected at least 20 blog briefs, found ${postCount}`);

const socialConversionPage = htmlByFile.get("social-growth.html");
if (!socialConversionPage) {
  failures.push("social-growth.html: missing social conversion landing page");
} else {
  [
    "Card Cosmic helps Nigerian users",
    "Trading involves risk",
    "data-registration-link",
    "data-safety-checklist",
    "data-gift-card-hub"
  ].forEach((needle) => {
    if (!socialConversionPage.includes(needle)) failures.push(`social-growth.html: missing ${needle}`);
  });
}

const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://cardcosmic.top/social-growth.html")) {
  failures.push("sitemap.xml: missing social-growth.html");
}

["tiktok.html", "instagram.html"].forEach((file) => {
  const html = htmlByFile.get(file) || "";
  if (!html.includes("social-growth.html?utm_source=")) failures.push(`${file}: missing tracked social-growth link`);
  if (!html.includes("CC-NG-2026")) failures.push(`${file}: missing shared Nigeria invite code`);
  if (!html.includes("Trading involves risk")) failures.push(`${file}: missing risk disclaimer`);
});

["index.html", "facebook.html"].forEach((file) => {
  const html = htmlByFile.get(file) || "";
  ["data-promo-page", "000000", 'id="download"', "data-copy-code", "apps.apple.com/us/app/cardcosmic/id6756063147", "play.google.com/store/apps/details?id=app.com.cardlaxy", "Trading involves risk"].forEach(needle => {
    if (!html.includes(needle)) failures.push(`${file}: missing campaign requirement ${needle}`);
  });
  if (html.includes("CC-NG-2026")) failures.push(`${file}: outdated invitation code`);
  if (html.includes("assets/site.js")) failures.push(`${file}: legacy script would duplicate campaign pixel tracking`);
  const heroStores = html.match(/<div class="store-buttons hero-stores"[\s\S]*?<\/div>/)?.[0] || "";
  for (const store of ["app_store", "google_play"]) {
    if (!heroStores.includes(`data-store="${store}" data-placement="hero"`)) failures.push(`${file}: missing tracked hero ${store} link`);
  }
  for (const control of ["data-scene-select", "data-scene-prev", "data-scene-next", "data-motion-toggle"]) {
    if (!html.includes(control)) failures.push(`${file}: missing carousel control ${control}`);
  }
  for (const requirement of ["combined downloads &amp; registrations", "Registration alone does not unlock withdrawal", "first successful eligible gift-card trade", "data-web-app", "https://app.cardcosmic.com/", "1% trade bonus", "not a guaranteed trade or payout time", "New accounts register in the mobile app"]) {
    if (!html.includes(requirement)) failures.push(`${file}: missing qualified conversion copy ${requirement}`);
  }
  for (const removed of ["Figures supplied by CardCosmic, October 2026", "Illustrative app preview. Not a live quote.", "#platform-data", "21 BRANDS", "01 / 21", "21 brands", "data-scene-count", "VOICES FROM CARDCOSMIC'S WEBSITE", "Jerome Bell", "Annette Black"]) {
    if (html.includes(removed)) failures.push(`${file}: outdated count, notice or testimonial ${removed}`);
  }
  for (const label of ["<dt>23+</dt><dd>gift-card brands</dd>", "23+ BRANDS. ONE PLACE TO TRADE.", "23+ brands"]) {
    if (!html.includes(label)) failures.push(`${file}: missing supported brand total ${label}`);
  }
  const reviews = html.match(/<section class="customer-notes"[\s\S]*?<\/section>/)?.[0] || "";
  for (const text of ["DON-MARK 12", "Ibrahimovicjnr", "Selected App Store review excerpts.", "Source: App Store", "apps.apple.com/us/app/cardcosmic/id6756063147", "play.google.com/store/apps/details?id=app.com.cardlaxy"]) {
    if (!reviews.includes(text)) failures.push(`${file}: missing review attribution ${text}`);
  }
  if ((reviews.match(/aria-label="5 out of 5 stars"/g) || []).length !== 2) failures.push(`${file}: expected the two screenshot review ratings`);
  if (reviews.includes("data-store=")) failures.push(`${file}: review-source clicks must not count as download clicks`);
  const ratingRows = [...html.matchAll(/<div class="store-ratings"[\s\S]*?<\/div>/g)].map(match => match[0]);
  if (ratingRows.length !== 2) failures.push(`${file}: expected ratings below both pairs of download buttons`);
  for (const row of ratingRows) {
    for (const text of ["4.3/5", "4.2/5", "US listings", 'datetime="2026-10-05"', "apps.apple.com/us/app/cardcosmic/id6756063147", "play.google.com/store/apps/details?id=app.com.cardlaxy"]) {
      if (!row.includes(text)) failures.push(`${file}: missing verified rating or provenance ${text}`);
    }
    if (/data-store=|data-web-app|4\.9/.test(row)) failures.push(`${file}: rating sources must not be download events or unverified scores`);
  }
  const withdrawalTiming = html.match(/<details id="withdrawal-timing"[\s\S]*?<\/details>/)?.[0] || "";
  for (const text of ["as little as 1 minute", "fastest-case estimate", "not a guaranteed bank arrival time", "https://www.cardcosmic.com/", "first successful eligible trade"]) {
    if (!withdrawalTiming.includes(text)) failures.push(`${file}: missing qualified withdrawal timing ${text}`);
  }
  const transactions = html.match(/<section class="transaction-section"[\s\S]*?<\/section>/)?.[0] || "";
  if ((transactions.match(/data-record="\d+"/g) || []).length !== 40) failures.push(`${file}: expected all 40 distinct screenshot transactions`);
  for (const text of ["Selected completed trades", "data-trades-viewport", "data-trades-toggle", "data-trades-list"]) {
    if (!transactions.includes(text)) failures.push(`${file}: missing transaction replay requirement ${text}`);
  }
  if (/minutes? ago|hours? ago|Just Sold!|Hundreds of Transactions|\bLive\b/i.test(transactions)) failures.push(`${file}: fixed records presented as current activity`);
  if (/screenshot|replay|Time at capture/i.test(transactions)) failures.push(`${file}: outdated transaction presentation`);
  for (let i = 1; i <= 4; i++) {
    if (!html.includes(`id="trade-panel-${i}"`) || !html.includes(`id="trade-tab-${i}"`)) failures.push(`${file}: missing trade step ${i}`);
    if (!existsSync(join(root, `assets/promo/trade-step-${i}.webp`))) failures.push(`${file}: missing trade image ${i}`);
  }
  if (!existsSync(join(root, "assets/promo/referral-program.webp"))) failures.push(`${file}: missing referral screen`);
  const referral = html.match(/<section class="section referral-section"[\s\S]*?<\/section>/)?.[0] || "";
  for (const requirement of ['id="referral"', "data-referral-tabs", "data-referral-navigation", "your own personal code", "not just referral rewards", "Referral Program Rules"]) {
    if (!referral.includes(requirement)) failures.push(`${file}: missing referral guide requirement ${requirement}`);
  }
  const referralScreens = ["referral-program", "referral-invites", "referral-rewards", "referral-balance"];
  referralScreens.forEach((screen, index) => {
    const panel = referral.match(new RegExp(`<article class="referral-panel" id="referral-panel-${index + 1}"[\\s\\S]*?</article>`))?.[0] || "";
    if (!referral.includes(`id="referral-tab-${index + 1}"`) || !panel.includes(`assets/promo/${screen}.webp`)) failures.push(`${file}: missing ordered referral step ${index + 1}`);
    if (!panel.includes('loading="lazy"') || !existsSync(join(root, `assets/promo/${screen}.webp`))) failures.push(`${file}: missing lazy-loaded referral image ${screen}`);
  });
  const catalog = html.match(/<ul class="card-grid">([\s\S]*?)<\/ul>/)?.[1] || "";
  const cardNames = ["apple", "steam", "razergold", "sephora", "ebay", "xbox", "googleplay", "amazon", "amex", "vanilla", "visa", "target", "walmart", "footlocker", "gamestop", "macys", "nordstrom", "playstation", "roblox", "kohls", "cvs"];
  if ((catalog.match(/<li>/g) || []).length !== cardNames.length) failures.push(`${file}: expected the existing featured gift-card collection`);
  for (const name of cardNames) {
    if (!catalog.includes(`data-placement="card-${name}"`)) failures.push(`${file}: missing card ${name}`);
    if (!existsSync(join(root, `assets/promo/${name}.png`))) failures.push(`${file}: missing logo ${name}`);
  }
  ["chime-service", "assets/promo-motion.js", "data-card-scene", 'id="reward-terms"', "&#8358;3,000"].forEach(needle => {
    if (!html.includes(needle)) failures.push(`${file}: missing reward/catalog requirement ${needle}`);
  });
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML pages and ${postCount} blog briefs.`);
