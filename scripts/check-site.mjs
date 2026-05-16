import { readFileSync, readdirSync } from "node:fs";
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
  if (!html.includes("assets/styles.css")) failures.push(`${file}: missing stylesheet`);
  if (!html.includes("assets/site.js")) failures.push(`${file}: missing site script`);

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

["tiktok.html", "instagram.html", "facebook.html"].forEach((file) => {
  const html = htmlByFile.get(file) || "";
  if (!html.includes("social-growth.html?utm_source=")) failures.push(`${file}: missing tracked social-growth link`);
  if (!html.includes("CC-NG-2026")) failures.push(`${file}: missing shared Nigeria invite code`);
  if (!html.includes("Trading involves risk")) failures.push(`${file}: missing risk disclaimer`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML pages and ${postCount} blog briefs.`);
