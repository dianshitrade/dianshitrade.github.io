(function () {
  "use strict";

  const INVITE_CODE = "000000";
  const PIXEL_ID = "1640453284465039";
  const CONSENT_KEY = "cardcosmic-promo-analytics-v1";
  const banner = document.querySelector(".consent");
  const privacyDialog = document.querySelector(".privacy-dialog");
  const toast = document.querySelector(".toast");
  const privacySignal = navigator.globalPrivacyControl === true;
  const isLocalPreview = ["127.0.0.1", "localhost"].includes(location.hostname) && new URLSearchParams(location.search).get("preview") === "mobile";
  let pixelReady = false;
  let toastTimer;
  let consent = readConsent();

  function readConsent() {
    if (privacySignal || isLocalPreview) return "denied";
    try {
      const value = localStorage.getItem(CONSENT_KEY);
      return value === "granted" || value === "denied" ? value : null;
    } catch (_) {
      return null;
    }
  }

  function initializePixel() {
    if (pixelReady || consent !== "granted") return;
    pixelReady = true;
    if (!window.fbq) {
      const fbq = window.fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
    window.fbq("consent", "grant");
    window.fbq("set", "autoConfig", false, PIXEL_ID);
    window.fbq("init", PIXEL_ID);
    window.fbq("trackSingle", PIXEL_ID, "PageView", { referral_code: INVITE_CODE });
  }

  // Only browser actions are recorded here. Verified registration belongs to the app/backend.
  function trackAction(name, properties) {
    if (consent !== "granted" || !pixelReady || typeof window.fbq !== "function") return;
    window.fbq("trackSingleCustom", PIXEL_ID, name, {
      referral_code: INVITE_CODE,
      page_source: document.body.dataset.campaignSource,
      ...properties
    });
  }

  function updatePrivacyStatus() {
    document.querySelector(".privacy-status").textContent = isLocalPreview
      ? "Analytics are disabled in this local mobile preview."
      : privacySignal
      ? "Analytics are disabled because your browser requests not to be tracked."
      : `Analytics: ${consent === "granted" ? "allowed" : "not allowed"}.`;
    document.querySelectorAll('[data-consent="granted"]').forEach(button => { button.disabled = privacySignal || isLocalPreview; });
  }

  function setConsent(value) {
    if (isLocalPreview) { privacyDialog.close(); return; }
    consent = privacySignal ? "denied" : value;
    try { localStorage.setItem(CONSENT_KEY, consent); } catch (_) { /* Downloads work without storage. */ }
    banner.hidden = true;
    if (consent === "granted") {
      if (pixelReady && typeof window.fbq === "function") window.fbq("consent", "grant");
      initializePixel();
    } else if (typeof window.fbq === "function") {
      window.fbq("consent", "revoke");
    }
    updatePrivacyStatus();
    privacyDialog.close();
  }

  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4200);
  }

  async function copyCode(button) {
    if (button.disabled) return;
    button.disabled = true;
    let copied = false;
    try {
      await navigator.clipboard.writeText(INVITE_CODE);
      copied = true;
    } catch (_) {
      const field = document.createElement("textarea");
      field.value = INVITE_CODE;
      field.setAttribute("readonly", "");
      field.setAttribute("aria-label", "Invitation code");
      field.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
      field.remove();
      button.focus({ preventScroll: true });
    }
    button.disabled = false;
    if (!copied) {
      notify("Copy wasn't available. Your code is 000000 (six zeros). Enter it in the app.");
      return;
    }
    const label = button.querySelector("[data-copy-label]");
    const icon = button.querySelector("use");
    if (!button.dataset.originalLabel) button.dataset.originalLabel = label.textContent;
    label.textContent = "Copied!";
    icon.setAttribute("href", "assets/promo/icons.svg#check");
    button.dataset.copied = "true";
    notify("000000 copied. Paste it into the invitation code field when you register.");
    trackAction("ReferralCodeCopy", { placement: button.dataset.placement });
    clearTimeout(button.copyTimer);
    button.copyTimer = setTimeout(() => {
      label.textContent = button.dataset.originalLabel;
      icon.setAttribute("href", "assets/promo/icons.svg#copy");
      delete button.dataset.copied;
    }, 3000);
  }

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".nav-links");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuButton.title = open ? "Close menu" : "Open menu";
    menuButton.querySelector("use").setAttribute("href", `assets/promo/icons.svg#${open ? "x" : "menu"}`);
  }
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-copy-code]");
    if (button) void copyCode(button);
    const choice = event.target.closest("[data-consent]");
    if (choice) setConsent(choice.dataset.consent);
    if (event.target.closest("[data-open-privacy]")) {
      updatePrivacyStatus();
      privacyDialog.showModal();
    }
    if (event.target.closest("[data-close-privacy]")) privacyDialog.close();
    const link = event.target.closest("a");
    if (link?.getAttribute("href") === "#download") {
      trackAction("DownloadSectionClick", { placement: link.dataset.placement || "navigation" });
    }
    if (link?.getAttribute("href") === "#reward-terms") {
      document.getElementById("reward-terms").open = true;
    }
    if (link?.dataset.store) {
      trackAction("AppDownloadClick", { platform: link.dataset.store, placement: link.dataset.placement });
    }
    if (link?.hasAttribute("data-web-app")) {
      trackAction("WebAppClick", { placement: link.dataset.placement });
    }
    if (link || !event.target.closest(".navigation")) setMenu(false);
  });

  const tradeTabs = Array.from(document.querySelectorAll("[data-trade-tab]"));
  const tradePanels = Array.from(document.querySelectorAll("[data-trade-panel]"));
  const tradeTabList = document.querySelector("[data-trade-tabs]");
  const tradeNavigation = document.querySelector("[data-trade-navigation]");
  if (tradeTabList && tradeTabs.length === tradePanels.length && tradeTabs.length) {
    let activeStep = 0;
    let transition;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    function showStep(index, focus = false) {
      activeStep = (index + tradeTabs.length) % tradeTabs.length;
      transition?.cancel();
      tradeTabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === activeStep));
        tab.tabIndex = i === activeStep ? 0 : -1;
        tradePanels[i].hidden = i !== activeStep;
      });
      document.querySelector("[data-trade-count]").textContent = `0${activeStep + 1} / 04`;
      if (focus) tradeTabs[activeStep].focus({ preventScroll: true });
      if (!reducedMotion.matches) transition = tradePanels[activeStep].animate(
        [{ opacity: .5, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 260, easing: "ease-out" }
      );
    }
    tradeTabList.setAttribute("role", "tablist");
    tradeTabs.forEach((tab, i) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", tradePanels[i].id);
      tradePanels[i].setAttribute("role", "tabpanel");
      tradePanels[i].setAttribute("aria-labelledby", tab.id);
      tradePanels[i].tabIndex = 0;
      tab.addEventListener("click", () => showStep(i));
      tab.addEventListener("keydown", event => {
        const destinations = { ArrowLeft: activeStep - 1, ArrowRight: activeStep + 1, Home: 0, End: tradeTabs.length - 1 };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        showStep(destinations[event.key], true);
      });
    });
    tradeNavigation.querySelector("[data-trade-prev]").addEventListener("click", () => showStep(activeStep - 1));
    tradeNavigation.querySelector("[data-trade-next]").addEventListener("click", () => showStep(activeStep + 1));
    reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) transition?.cancel(); });
    tradeTabList.hidden = tradeNavigation.hidden = false;
    showStep(0);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      document.querySelector(".mobile-bar").classList.toggle("in-download", entry.isIntersecting);
    }, { rootMargin: "-90px 0px -80px 0px", threshold: 0 });
    observer.observe(document.querySelector("#download"));
  }
  updatePrivacyStatus();
  banner.hidden = consent !== null;
  initializePixel();
})();
