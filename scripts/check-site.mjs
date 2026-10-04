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
  for (const requirement of ["combined downloads &amp; registrations", "not unique users", "Registration alone does not unlock withdrawal", "first successful eligible gift-card trade", "data-web-app", "https://app.cardcosmic.com/", "1% trade bonus", "not independently verified reviews", "not a guaranteed trade or payout time", "New accounts register in the mobile app"]) {
    if (!html.includes(requirement)) failures.push(`${file}: missing qualified conversion copy ${requirement}`);
  }
  for (let i = 1; i <= 4; i++) {
    if (!html.includes(`id="trade-panel-${i}"`) || !html.includes(`id="trade-tab-${i}"`)) failures.push(`${file}: missing trade step ${i}`);
    if (!existsSync(join(root, `assets/promo/trade-step-${i}.webp`))) failures.push(`${file}: missing trade image ${i}`);
  }
  if (!existsSync(join(root, "assets/promo/referral-program.webp"))) failures.push(`${file}: missing referral screen`);
  const catalog = html.match(/<ul class="card-grid">([\s\S]*?)<\/ul>/)?.[1] || "";
  const cardNames = ["apple", "steam", "razergold", "sephora", "ebay", "xbox", "googleplay", "amazon", "amex", "vanilla", "visa", "target", "walmart", "footlocker", "gamestop", "macys", "nordstrom", "playstation", "roblox", "kohls", "cvs"];
  if ((catalog.match(/<li>/g) || []).length !== cardNames.length) failures.push(`${file}: expected 21 distinct gift-card brands`);
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
