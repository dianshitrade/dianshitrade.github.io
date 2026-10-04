import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const { records } = JSON.parse(readFileSync(join(root, "assets/promo/transactions.json"), "utf8"));
const brands = { apple: "Apple / iTunes", steam: "Steam", razergold: "Razer Gold" };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const rows = records.map((record, index) => {
  if (!brands[record.brand] || !Number.isFinite(record.value) || !Number.isFinite(record.minutesBeforeCapture) || !record.name.includes("*")) throw new Error(`Invalid transaction ${index}`);
  const name = record.name.replace(/\*{3,}/g, "***");
  return `                <li class="trade-record" data-record="${index + 1}"><img src="assets/promo/${record.brand}.png" width="40" height="40" alt="" loading="lazy"><div class="trade-record-main"><strong>${record.value} ${brands[record.brand]}</strong><span title="${escape(record.name)}">${escape(name)}</span></div><div class="trade-record-meta"><span class="trade-completed"><svg class="icon" aria-hidden="true"><use href="assets/promo/icons.svg#check"></use></svg>Completed</span></div></li>`;
}).join("\n");
const pattern = /<!-- transaction-records:start -->[\s\S]*?<!-- transaction-records:end -->/;
for (const page of ["index.html", "facebook.html"]) {
  const path = join(root, page);
  const source = readFileSync(path, "utf8");
  if (!pattern.test(source)) throw new Error(`Missing transaction markers in ${page}`);
  const result = source.replace(pattern, `<!-- transaction-records:start -->\n${rows}\n                <!-- transaction-records:end -->`);
  if (process.argv.includes("--check")) {
    if (result !== source) throw new Error(`${page}: run npm run generate:trades to update transaction records`);
  } else if (result !== source) writeFileSync(path, result);
}
console.log(`Checked ${records.length} screenshot transaction records on both promo pages.`);
