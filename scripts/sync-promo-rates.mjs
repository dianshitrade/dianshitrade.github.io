import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const rates = JSON.parse(readFileSync(join(root, "assets/promo/rates.json"), "utf8"));
if (!/^\d{4}-\d{2}-\d{2}$/.test(rates.suppliedOn) || !Number.isFinite(Date.parse(rates.expiresAt))) throw Error("Invalid rate dates");
const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rows = rates.brands.map(brand => {
  if (!/^[a-z]+$/.test(brand.id) || !brand.rates.length) throw Error("Invalid brand");
  const cells = brand.rates.map(rate => {
    if (!Number.isFinite(rate.rate) || rate.rate <= 0 || !/^[A-Z]{3}$/.test(rate.currency)) throw Error("Invalid rate");
    return `<li><span>${escape(rate.label)} / ${rate.currency}</span><strong>&#8358;${rate.rate.toLocaleString("en-US")}</strong></li>`;
  }).join("");
  return `<div class="rate-brand-row"><h4><img src="assets/promo/${brand.id}.png" width="28" height="28" alt="" loading="lazy">${escape(brand.name)}</h4><ul>${cells}</ul></div>`;
}).join("\n");
const date = new Date(`${rates.suppliedOn}T12:00:00Z`).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
const generated = `<p class="rate-snapshot-note">Reference rates supplied by CardCosmic on <time datetime="${rates.suppliedOn}">${date}</time>. NGN per 1 unit of card currency. Not a live quote.</p>\n${rows}\n<script type="application/json" data-rate-snapshot>${JSON.stringify(rates).replaceAll("<", "\\u003c")}</script>`;
const pattern = /<!-- rate-snapshot:start -->[\s\S]*?<!-- rate-snapshot:end -->/;
for (const file of ["index.html", "facebook.html"]) {
  const path = join(root, file);
  const source = readFileSync(path, "utf8");
  if (!pattern.test(source)) throw Error(`Missing rate markers: ${file}`);
  const result = source.replace(pattern, `<!-- rate-snapshot:start -->\n${generated}\n<!-- rate-snapshot:end -->`);
  if (process.argv.includes("--check")) {
    if (result !== source) throw Error(`${file}: run npm run generate:rates`);
  } else if (result !== source) writeFileSync(path, result);
}
console.log(`Checked ${rates.brands.length} brands and ${rates.brands.reduce((n,b)=>n+b.rates.length,0)} reference rates.`);
