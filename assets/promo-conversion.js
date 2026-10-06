export function quoteFor(snapshot, brandId, region, input, now = Date.now()) {
  const expires = Date.parse(snapshot?.expiresAt);
  if (!Number.isFinite(expires) || !Number.isFinite(now)) return { error: "unavailable" };
  if (now >= expires) return { error: "expired" };
  const brand = snapshot.brands?.find(item => item.id === brandId);
  const rate = brand?.rates?.find(item => item.region === region);
  if (!rate || !Number.isFinite(rate.rate) || rate.rate <= 0) return { error: "unavailable" };
  const text = String(input).trim();
  if (!text) return { error: "empty" };
  if (!/^(?:\d+|\d*\.\d{1,2})$/.test(text)) return { error: "invalid" };
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) return { error: "invalid" };
  return { amount, rate: rate.rate, currency: rate.currency, value: Math.round(amount * rate.rate * 100) / 100 };
}

function recordAction(name, properties) {
  document.dispatchEvent(new CustomEvent("cardcosmic:conversion", { detail: { name, properties } }));
}

function initializeRates() {
  const form = document.querySelector("[data-rate-form]");
  const data = document.querySelector("[data-rate-snapshot]");
  if (!form || !data) return;
  let snapshot;
  try {
    snapshot = JSON.parse(data.textContent);
    if (!snapshot.brands?.length || !snapshot.brands.every(brand => brand.rates?.length)) return;
  } catch (_) { return; }
  const brand = form.querySelector("[data-rate-brand]");
  const region = form.querySelector("[data-rate-region]");
  const amount = form.querySelector("[data-rate-amount]");
  const value = form.querySelector("[data-rate-value]");
  const equation = form.querySelector("[data-rate-equation]");
  const status = form.querySelector("[data-rate-status]");
  const number = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 });
  const supplied = new Date(snapshot.suppliedOn + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  snapshot.brands.forEach(item => brand.add(new Option(item.name, item.id)));

  function updateRegions() {
    const previous = region.value;
    const rates = snapshot.brands.find(item => item.id === brand.value).rates;
    region.replaceChildren(...rates.map(item => {
      const option = new Option(`${item.region} / ${item.currency}`, item.region);
      option.title = item.label;
      option.setAttribute("aria-label", `${item.label} / ${item.currency}`);
      return option;
    }));
    region.value = rates.some(item => item.region === previous) ? previous : rates[0].region;
  }
  function render() {
    const rate = snapshot.brands.find(item => item.id === brand.value)?.rates.find(item => item.region === region.value);
    region.title = rate?.label || "Country / currency";
    form.querySelector("[data-rate-currency]").textContent = rate?.currency || "";
    const quote = quoteFor(snapshot, brand.value, region.value, amount.value);
    value.textContent = quote.error ? "No estimate" : `\u20a6${number.format(quote.value)}`;
    value.classList.toggle("rate-value-empty", Boolean(quote.error));
    equation.textContent = quote.error ? {
      empty: "Enter your card's face value.",
      invalid: "Use a value from 0.01 to 1,000,000, with up to two decimal places.",
      unavailable: "Check the current quote in the app.",
      expired: "This rate snapshot has expired. Check the current quote in the app."
    }[quote.error] : `${number.format(quote.amount)} ${quote.currency} \u00d7 \u20a6${number.format(quote.rate)} per ${quote.currency}`;
    status.textContent = `Supplied ${supplied} \u00b7 ${quote.error === "expired" ? "Update required" : "Reference only"}`;
    form.dataset.rateState = quote.error || "ready";
    return quote;
  }
  brand.addEventListener("change", () => { updateRegions(); render(); });
  region.addEventListener("change", render);
  amount.addEventListener("input", render);
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!render().error) recordAction("RateEstimate", { card_brand: brand.value, card_region: region.value });
  });
  // Clear an open estimate when its dated snapshot expires, even without another input.
  const refreshOnExpiry = () => {
    const remaining = Date.parse(snapshot.expiresAt) - Date.now();
    if (remaining > 0) setTimeout(refreshOnExpiry, Math.min(remaining + 1, 2147483647));
    else render();
  };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  updateRegions();
  render();
  refreshOnExpiry();
  form.hidden = false;
}

function initializePayouts() {
  const records = Array.from(document.querySelectorAll(".payout-record"));
  const dialog = document.querySelector(".payout-dialog");
  if (!records.length || !dialog || typeof dialog.showModal !== "function") return;
  const image = dialog.querySelector("[data-payout-image]");
  const state = dialog.querySelector("[data-payout-state]");
  const original = dialog.querySelector("[data-payout-full]");
  let current = 0;
  let trigger;
  function show(index) {
    current = (index + records.length) % records.length;
    const record = records[current];
    const title = `${record.querySelector("strong").textContent} \u00b7 ${record.dataset.bank}`;
    dialog.querySelector("[data-payout-title]").textContent = title;
    dialog.querySelector("[data-payout-count]").textContent = `${current + 1} / ${records.length}`;
    dialog.querySelector("[data-payout-note]").textContent = current === 0
      ? "CardCosmic withdrawal screen, marked Completed. Original dates are retained; this record is not a payout-time guarantee."
      : "Transfer record, marked Success. The amount shown is Amount debited, not a separate confirmation of the recipient's net credit.";
    original.href = record.href;
    image.hidden = true;
    state.hidden = false;
    state.textContent = "Loading record...";
    image.alt = `${title}. Personal identifiers hidden; original amount, dates and status retained.`;
    image.onload = () => { image.hidden = false; state.hidden = true; };
    image.onerror = () => { image.hidden = true; state.textContent = "This image could not load. Open the full-size record below or try again."; };
    image.src = record.href;
    recordAction("PayoutProofView", { record: String(current + 1) });
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("[data-payout-open]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = Number(link.dataset.payoutOpen);
    if (!Number.isInteger(index) || !records[index]) return;
    event.preventDefault();
    trigger = link;
    show(index);
    dialog.showModal();
  });
  dialog.querySelector("[data-payout-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-payout-prev]").addEventListener("click", () => show(current - 1));
  dialog.querySelector("[data-payout-next]").addEventListener("click", () => show(current + 1));
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => trigger?.focus({ preventScroll: true }));
}

if (typeof document !== "undefined") {
  initializeRates();
  initializePayouts();
}
