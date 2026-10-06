import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const { quoteFor } = await import(`data:text/javascript;base64,${Buffer.from(read("assets/promo-conversion.js")).toString("base64")}`);
const snapshot = JSON.parse(read("assets/promo/rates.json"));
const validAt = Date.parse("2026-10-06T12:00:00+01:00");
const fixture = {
  apple: { US:1213, CA:793, AU:798, DE:1037, UK:1326, MX:61 },
  steam: { US:1128, UK:1418, EU:1224, CA:746, AU:741, CH:1280 },
  razergold: { US:1218, CA:843, AU:827, MX:68, BR:237, MY:277 },
  xbox: { US:1096, UK:1267, EU:1074, CA:752, AU:677, CH:1118 },
  ebay: { US:816 }
};

test("all 25 owner-supplied rates calculate per unit, with no bonus added", () => {
  assert.equal(snapshot.brands.length, 5);
  let count = 0;
  for (const brand of snapshot.brands) {
    assert.deepEqual(Object.fromEntries(brand.rates.map(r => [r.region, r.rate])), fixture[brand.id]);
    for (const rate of brand.rates) {
      assert.equal(quoteFor(snapshot, brand.id, rate.region, "100", validAt).value, rate.rate * 100);
      count++;
    }
  }
  assert.equal(count, 25);
  assert.equal(quoteFor(snapshot, "apple", "US", "100", validAt).value, 121300);
  assert.equal(quoteFor(snapshot, "apple", "US", "10.25", validAt).value, 12433.25);
  assert.equal(quoteFor(snapshot, "steam", "UK", "100", validAt).currency, "GBP");
});

test("missing, invalid, unsupported and expired inputs never return a stale number", () => {
  for (const input of ["", " ", "0", "-10", "NaN", "Infinity", "1e3", "1000001", "0.001", "100.999", undefined, null]) {
    const quote = quoteFor(snapshot, "apple", "US", input, validAt);
    assert.ok(quote.error, String(input));
    assert.equal(quote.value, undefined);
  }
  assert.equal(quoteFor(snapshot, "ebay", "UK", "100", validAt).error, "unavailable");
  assert.equal(quoteFor(snapshot, "bad", "US", "100", validAt).error, "unavailable");
  assert.equal(quoteFor(snapshot, "apple", "US", "100", Date.parse(snapshot.expiresAt) - 1).value, 121300);
  assert.equal(quoteFor(snapshot, "apple", "US", "100", Date.parse(snapshot.expiresAt)).error, "expired");
  assert.equal(quoteFor({...snapshot,expiresAt:"bad"}, "apple", "US", "100", validAt).error, "unavailable");
});

test("both landing pages contain matching snapshots, six redacted records and no download tracking on proof links", () => {
  for (const file of ["index.html", "facebook.html"]) {
    const html = read(file);
    assert.deepEqual(JSON.parse(html.match(/data-rate-snapshot>([^<]+)<\/script>/)[1]), snapshot);
    assert.equal((html.match(/class="rate-brand-row"/g)||[]).length, 5);
    const records = [...html.matchAll(/<a class="payout-record"[^>]+>/g)].map(m=>m[0]);
    assert.equal(records.length, 6);
    for (const record of records) {
      assert.ok(!record.includes("data-store"));
      const src = record.match(/href="([^"]+)"/)[1];
      assert.match(src, /^assets\/promo\/payouts\/[a-z0-9-]+\.png$/);
      assert.ok(existsSync(new URL(src, root)));
    }
    assert.ok(html.includes("before withdrawal fees"));
    assert.ok(html.includes("is not included in this estimate"));
    assert.ok(html.includes("Not a live quote"));
    assert.ok(html.includes("assets/promo-conversion.js?v=20261006-quotes"));
    assert.ok(!html.includes("codex-clipboard-"));
  }
  assert.equal(read("index.html").split("<body")[1].replace('data-campaign-source="website"','data-campaign-source="facebook"'),read("facebook.html").split("<body")[1]);
});
