(function () {
  if (window.cardCosmicPixelInstalled) return;
  window.cardCosmicPixelInstalled = true;
  const pixelId = "1640453284465039";
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
  window.fbq("set", "autoConfig", false, pixelId);
  window.fbq("init", pixelId);
  window.fbq("trackSingle", pixelId, "PageView");
  document.addEventListener("click", function (event) {
    const link = event.target.closest && event.target.closest("a");
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    let platform;
    if (url.hostname === "apps.apple.com") platform = "app_store";
    if (url.hostname === "play.google.com") platform = "google_play";
    if (platform) {
      window.fbq("trackSingleCustom", pixelId, "AppDownloadClick", { platform });
    } else if (link.hasAttribute("data-registration-link")) {
      window.fbq("trackSingleCustom", pixelId, "RegistrationLinkClick");
    }
  }, true);
})();

(function () {
  const data = window.CARD_COSMIC;
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector("[data-menu-toggle]");

  if (toggle && header) {
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll("[data-app-store]").forEach((link) => link.href = data.appStoreUrl);
  document.querySelectorAll("[data-google-play]").forEach((link) => link.href = data.googlePlayUrl);
  document.querySelectorAll("[data-whatsapp]").forEach((link) => link.href = data.whatsappUrl);
  document.querySelectorAll("[data-phone]").forEach((link) => link.href = data.phoneUrl);
  document.querySelectorAll("[data-invite-code]").forEach((node) => node.textContent = data.socialInviteCode);
  document.querySelectorAll("[data-registration-link]").forEach((link) => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") || link.dataset.source || "social";
    const campaign = params.get("utm_campaign") || "profile_code";
    const target = new URL(data.socialRegistrationBase, window.location.href);
    target.searchParams.set("utm_source", source);
    target.searchParams.set("utm_campaign", campaign);
    target.searchParams.set("code", data.socialInviteCode);
    link.href = target.pathname.replace(/^\//, "") + target.search + target.hash;
  });
  document.querySelectorAll("[data-app-image]").forEach((img) => img.src = data.appImage);
  document.querySelectorAll("[data-local-hero]").forEach((img) => img.src = data.localHeroImage);
  document.querySelectorAll("[data-hero-video]").forEach((video) => {
    video.src = data.heroVideo;
    video.load();
  });
  document.querySelectorAll("[data-logo-image]").forEach((img) => img.src = data.logoImage);

  const rateGrid = document.querySelector("[data-rates-grid]");
  if (rateGrid) {
    const limit = Number(rateGrid.dataset.limit || data.rates.length);
    rateGrid.innerHTML = data.rates.slice(0, limit).map((item) => `
      <article class="card rate-card">
        <div>
          <div class="rate-top">
            <div>
              <h3>${item.brand}</h3>
              <p>${item.intro}</p>
            </div>
            <span class="brand-logo ${item.logoClass}" aria-label="${item.brand} logo">
              ${item.logoUrl ? `<img class="brand-logo-img" src="${item.logoUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ""}
              <span class="brand-logo-fallback">${item.logoText}</span>
            </span>
          </div>
          <div class="rates-list">
            ${item.rates.map(([country, rate]) => `<div class="rate-line"><span>${country}</span><strong>${rate}</strong></div>`).join("")}
          </div>
          ${item.todayRecommendation ? `<div class="rate-recommendation">${item.todayRecommendation}</div>` : ""}
        </div>
        <a class="button primary full" data-whatsapp href="${data.whatsappUrl}">Ask for live rate</a>
      </article>
    `).join("");
  }

  const highlightsGrid = document.querySelector("[data-media-highlights]");
  if (highlightsGrid) {
    highlightsGrid.innerHTML = data.mediaHighlights.map((item) => `
      <article class="media-highlight-card">
        <span class="tag">${item.label}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        ${item.recommendation ? `<div class="recommendation-reason">${item.recommendation}</div>` : ""}
        <div class="compact-card-meta">
          <span class="article-meta">${item.meta}</span>
          ${item.readingTime ? `<span class="reading-time">${item.readingTime}</span>` : ""}
          ${item.discussions !== undefined ? `<span class="discussions-count">${item.discussions} discussions</span>` : ""}
        </div>
        <a class="button secondary full" href="${item.href}">Open signal</a>
      </article>
    `).join("");
  }

  const newsGrid = document.querySelector("[data-news-feed]");
  function renderNewsFeed(category) {
    if (!newsGrid) return;
    const limit = Number(newsGrid.dataset.limit || data.localNews.length);
    let items = data.localNews;
    if (category) {
      items = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }
    items = [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
    newsGrid.innerHTML = items.slice(0, limit).map((item) => `
      <article class="source-card compact">
        <div class="source-score">${item.score}</div>
        <div class="compact-card-body">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="tag">${item.category}</span>
            ${item.timestamp ? `<span class="timestamp">${item.timestamp}</span>` : ""}
          </div>
          <h3 style="font-size:1.12rem;margin:0;">${item.source} — ${item.title}</h3>
          <p style="margin:0;color:var(--muted);font-size:0.92rem;">${item.summary}</p>
          ${item.recommendation ? `<div class="recommendation-reason">${item.recommendation}</div>` : ""}
          <div class="compact-card-meta">
            ${item.readingTime ? `<span class="reading-time">${item.readingTime}</span>` : ""}
            ${item.discussions !== undefined ? `<span class="discussions-count">${item.discussions} discussions</span>` : ""}
            <a href="${item.url}" target="_blank" rel="noopener" style="color:var(--green-dark);font-weight:800;font-size:0.88rem;">Visit source</a>
          </div>
        </div>
      </article>
    `).join("");
  }
  if (newsGrid) renderNewsFeed("");

  const categoryFilterBar = document.querySelector("[data-category-filter]");
  if (categoryFilterBar) {
    const target = categoryFilterBar.dataset.target || "news";
    const sourceData = target === "posts" ? data.posts : data.localNews;
    const isObj = sourceData.length > 0 && typeof sourceData[0] === 'object' && !Array.isArray(sourceData[0]);
    const categories = sourceData.map(item => isObj ? item.category : item[2]);
    const cats = ["All", ...new Set(categories)];
    categoryFilterBar.innerHTML = cats.map((cat, i) =>
      `<span class="category-pill${i === 0 ? ' active' : ''}" data-category="${cat === 'All' ? '' : cat}">${cat}</span>`
    ).join("");
    categoryFilterBar.querySelectorAll(".category-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        categoryFilterBar.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const category = pill.dataset.category;
        if (target === "posts") {
          renderPostGrid(category);
        } else {
          renderNewsFeed(category);
        }
      });
    });
  }

  const opportunitiesGrid = document.querySelector("[data-opportunities]");
  if (opportunitiesGrid) {
    opportunitiesGrid.innerHTML = data.opportunitySources.map((item) => `
      <article class="source-card opportunity-card">
        <div class="source-score">${item.score}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span class="tag">Opportunity</span>
          ${item.isTrending ? '<span class="trending-badge">Trending</span>' : ""}
        </div>
        <h3>${item.name}</h3>
        <strong>${item.examples}</strong>
        <p>${item.note}</p>
        ${item.recommendation ? `<div class="recommendation-reason">${item.recommendation}</div>` : ""}
        ${item.readingTime ? `<span class="reading-time" style="margin-top:8px;display:inline-flex;">${item.readingTime}</span>` : ""}
      </article>
    `).join("");
  }

  const giftHub = document.querySelector("[data-gift-card-hub]");
  if (giftHub) {
    const limit = Number(giftHub.dataset.limit || data.giftCardHub.length);
    giftHub.innerHTML = data.giftCardHub.slice(0, limit).map((item) => `
      <article class="card hub-card" id="${item.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">
        <span class="tag">${item.keyword}</span>
        <h3>${item.brand}</h3>
        <div class="hub-rate">${item.rate}</div>
        <p><strong>Countries:</strong> ${item.countries}</p>
        <p>${item.guide}</p>
        ${item.recommendation ? `<div class="recommendation-reason" style="margin-top:12px;margin-bottom:8px;">${item.recommendation}</div>` : ""}
        <div class="cta-row">
          <a class="button primary" href="${item.slug}">Open page</a>
          <a class="button secondary" href="${data.whatsappUrl}">WhatsApp quote</a>
        </div>
      </article>
    `).join("");
  }

  const funnelGrid = document.querySelector("[data-funnel-pages]");
  if (funnelGrid) {
    funnelGrid.innerHTML = data.funnelPages.map((item) => `
      <article class="card funnel-card">
        <span class="tag">${item.channel}</span>
        <h3>${item.path}</h3>
        <p><strong>Tracking code:</strong> ${item.code}</p>
        <p>${item.message}</p>
        <a class="button secondary full" href="${item.path}">Open landing page</a>
      </article>
    `).join("");
  }

  const platformGrid = document.querySelector("[data-platform-copy]");
  if (platformGrid && data.socialConversion) {
    platformGrid.innerHTML = data.socialConversion.platformLinks.map((item) => `
      <article class="social-action-card">
        <span class="tag">${item.platform}</span>
        <h3>${item.handle}</h3>
        <p>${item.action}</p>
        <a class="button secondary full" href="${item.href}">Open tracked link</a>
      </article>
    `).join("");
  }

  const pinnedGrid = document.querySelector("[data-pinned-videos]");
  if (pinnedGrid && data.socialConversion) {
    pinnedGrid.innerHTML = data.socialConversion.pinnedVideos.map((item) => `
      <article class="social-script">
        <span class="tag">Pinned video</span>
        <h3>${item.title}</h3>
        <p><strong>Hook:</strong> ${item.hook}</p>
        <p><strong>CTA:</strong> ${item.cta}</p>
      </article>
    `).join("");
  }

  const topicGrid = document.querySelector("[data-topic-grid]");
  if (topicGrid && data.socialConversion) {
    topicGrid.innerHTML = data.socialConversion.dailyTopics.map((topic, index) => `
      <div class="topic-chip"><span>${String(index + 1).padStart(2, "0")}</span>${topic}</div>
    `).join("");
  }

  const safetyList = document.querySelector("[data-safety-checklist]");
  if (safetyList && data.socialConversion) {
    safetyList.innerHTML = data.socialConversion.safetyChecklist.map((item) => `<li>${item}</li>`).join("");
  }

  const bioList = document.querySelector("[data-profile-bio]");
  if (bioList && data.socialConversion) {
    bioList.innerHTML = data.socialConversion.profileBio.map((line) => `<li>${line}</li>`).join("");
  }

  const cadenceList = document.querySelector("[data-weekly-cadence]");
  if (cadenceList && data.socialConversion) {
    cadenceList.innerHTML = data.socialConversion.weeklyCadence.map((item) => `<li>${item}</li>`).join("");
  }

  const metricsGrid = document.querySelector("[data-metrics-grid]");
  if (metricsGrid && data.socialConversion) {
    metricsGrid.innerHTML = data.socialConversion.metrics.map((item) => `<span>${item}</span>`).join("");
  }

  document.querySelectorAll("[data-comment-template]").forEach((node) => {
    node.textContent = data.socialConversion?.commentTemplate || "";
  });

  document.querySelectorAll("[data-dm-template]").forEach((node) => {
    node.textContent = data.socialConversion?.dmTemplate || "";
  });

  const postGrid = document.querySelector("[data-posts-grid]");
  function renderPostGrid(category) {
    if (!postGrid) return;
    const limit = Number(postGrid.dataset.limit || data.posts.length);
    let allItems = data.posts;
    const isObjectFormat = allItems.length > 0 && typeof allItems[0] === 'object' && !Array.isArray(allItems[0]);

    let items = allItems;
    if (category) {
      items = items.filter(item => isObjectFormat ? item.category === category : item[2] === category);
    }
    if (isObjectFormat) {
      items = [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    postGrid.innerHTML = items.slice(0, limit).map((item) => {
      const title = isObjectFormat ? item.title : item[0];
      const slug = isObjectFormat ? item.slug : item[1];
      const cat = isObjectFormat ? item.category : item[2];
      const desc = isObjectFormat ? item.desc : item[3];
      const score = isObjectFormat ? item.score : undefined;
      const readingTime = isObjectFormat ? item.readingTime : "4 min read";
      const recommendation = isObjectFormat ? item.recommendation : undefined;
      const discussions = isObjectFormat ? item.discussions : undefined;
      return `
        <article class="card blog-card">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <span class="tag">${cat}</span>
              ${score !== undefined ? `<span class="source-score" style="position:static;width:44px;height:44px;font-size:0.72rem;">${score}</span>` : ""}
            </div>
            <h3 style="margin-top:16px">${title}</h3>
            <p>${desc}</p>
            ${recommendation ? `<div class="recommendation-reason" style="margin-top:12px;">${recommendation}</div>` : ""}
          </div>
          <div>
            <div class="compact-card-meta" style="margin-bottom:10px;">
              <span class="reading-time">${readingTime}</span>
              ${discussions !== undefined ? `<span class="discussions-count">${discussions} discussions</span>` : ""}
            </div>
            <a class="button secondary full" href="blog.html#${slug}">Read brief</a>
          </div>
        </article>
      `;
    }).join("");
  }
  if (postGrid) renderPostGrid("");

  const faqList = document.querySelector("[data-faq-list]");
  if (faqList) {
    faqList.innerHTML = data.faqs.map(([q, a]) => `
      <details class="faq-item">
        <summary>${q}</summary>
        <p>${a}</p>
      </details>
    `).join("");
  }

  const testimonialGrid = document.querySelector("[data-testimonials]");
  if (testimonialGrid) {
    const testimonials = [...data.testimonials, ...data.testimonials];
    testimonialGrid.classList.remove("grid", "three");
    testimonialGrid.classList.add("testimonial-marquee");
    testimonialGrid.innerHTML = `<div class="testimonial-marquee-track">
      ${testimonials.map(([name, place, quote, avatarClass, note]) => `
      <article class="card testimonial">
        <p>"${quote}"</p>
        <div class="person">
          <div class="avatar portrait ${avatarClass || "student"}" aria-label="${place} avatar"><span></span></div>
          <div><strong>${name}</strong><br><span class="article-meta">${place}</span><br><span class="persona-note">${note || "Sample profile"}</span></div>
        </div>
      </article>
      `).join("")}
    </div>`;
  }

  const brandGrid = document.querySelector("[data-brand-logos]");
  if (brandGrid) {
    const brands = brandGrid.classList.contains("logo-marquee") ? [...data.brandLogos, ...data.brandLogos] : data.brandLogos;
    brandGrid.innerHTML = brands.map(([name, className, label]) => `
      <article class="brand-logo-card">
        <span class="brand-logo ${className}">${label}</span>
        <strong>${name}</strong>
      </article>
    `).join("");
  }

  const rateTable = document.querySelector("[data-rate-table]");
  if (rateTable) {
    rateTable.innerHTML = data.rateRows.map((row) => `
      <div class="rate-table-row">
        <div class="rate-table-brand">
          <span class="brand-logo mini ${row.className}" aria-label="${row.brand} logo">
            ${row.logoUrl ? `<img class="brand-logo-img" src="${row.logoUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ""}
            <span class="brand-logo-fallback">${row.logoText || row.brand}</span>
          </span>
          <strong>${row.brand}</strong>
        </div>
        <span>${row.country}</span>
        ${row.values.map((value) => `<strong>${value}</strong>`).join("")}
      </div>
    `).join("");
  }

  const videoRail = document.querySelector("[data-video-rail]");
  if (videoRail) {
    videoRail.innerHTML = data.videoPosters.map((item, index) => `
      <article class="video-card">
        ${item.video ? `<video src="${item.video}" preload="metadata" muted playsinline controls></video>` : `<img src="${item.image}" alt="${item.title}">`}
        <div class="video-overlay">
          <span>${item.tag}</span>
          <strong>${item.title}</strong>
          <button aria-label="Play ${item.title}">▶</button>
        </div>
      </article>
    `).join("");

    videoRail.querySelectorAll(".video-card").forEach((card) => {
      const video = card.querySelector("video");
      if (!video) return;
      const playWithSound = () => {
        video.muted = false;
        video.volume = 1;
        video.play();
      };
      card.addEventListener("click", playWithSound);
      video.addEventListener("click", playWithSound);
      video.addEventListener("play", () => {
        video.muted = false;
        card.classList.add("is-playing");
      });
      video.addEventListener("pause", () => card.classList.remove("is-playing"));
    });
  }

  const translationMaps = {
    "en-GB": {
      "Sell gift cards with clear rates and fast support.": "Sell gift cards with clear rates and fast support.",
      "Gift cards to Naira · Nigeria": "Gift cards to naira · Nigeria",
      "Download App": "Download App",
      "Ask for live rate": "Ask for live rate"
    },
    fr: {
      "Rates": "Taux",
      "How it works": "Comment ça marche",
      "Sell Gift Cards": "Vendre des cartes cadeaux",
      "Blog": "Blog",
      "Videos": "Vidéos",
      "FAQ": "FAQ",
      "WhatsApp": "WhatsApp",
      "Download App": "Télécharger l’app",
      "View rates": "Voir les taux",
      "Ask for live rate": "Demander le taux actuel",
      "Ask for today’s quote": "Demander le devis du jour",
      "Open full rates": "Voir tous les taux",
      "Open video page": "Ouvrir la page vidéo",
      "Chat on WhatsApp": "Discuter sur WhatsApp",
      "Gift cards to Naira · Nigeria": "Cartes cadeaux en naira · Nigeria",
      "Sell gift cards with clear rates and fast support.": "Vendez des cartes cadeaux avec des taux clairs et une assistance rapide.",
      "Card Cosmic helps Nigerian traders check daily rates, download the app, and start supported gift card trades without confusing middlemen.": "Card Cosmic aide les utilisateurs au Nigeria à vérifier les taux du jour, télécharger l’app et commencer à vendre des cartes cadeaux prises en charge.",
      "Popular rates": "Taux populaires",
      "Check high-demand gift cards.": "Consultez les cartes cadeaux les plus demandées.",
      "Supported gift card brands": "Marques de cartes cadeaux prises en charge",
      "Promotional rates": "Taux promotionnels",
      "Turn popular cards into strong Naira value.": "Transformez les cartes populaires en forte valeur en naira.",
      "Rate board": "Tableau des taux",
      "Example high-rate table for promotions.": "Exemples de taux élevés pour les promotions.",
      "Creator videos": "Vidéos de créateurs",
      "Scrollable video preview for promotions.": "Aperçu vidéo défilant pour les promotions.",
      "Start with the app": "Commencez avec l’app",
      "Ready to check your gift card rate?": "Prêt à vérifier le taux de votre carte cadeau?",
      "Download Card Cosmic or message support for current rate guidance.": "Téléchargez Card Cosmic ou contactez le support pour connaître le taux actuel.",
      "Daily rate": "Taux du jour",
      "Ask in app": "Demander dans l’app",
      "Read brief": "Lire le résumé",
      "discussions": "discussions",
      "Trending": "Tendance",
      "Visit source": "Voir la source",
      "Open signal": "Ouvrir le signal"
    },
    zh: {
      "Rates": "汇率",
      "How it works": "使用流程",
      "Sell Gift Cards": "出售礼品卡",
      "Blog": "文章",
      "Videos": "达人视频",
      "FAQ": "常见问题",
      "WhatsApp": "WhatsApp",
      "Download App": "下载 App",
      "View rates": "查看汇率",
      "Ask for live rate": "咨询实时汇率",
      "Ask for today’s quote": "咨询今日报价",
      "Open full rates": "打开完整汇率",
      "Open video page": "打开视频页面",
      "Chat on WhatsApp": "通过 WhatsApp 联系",
      "Gift cards to Naira · Nigeria": "礼品卡兑换奈拉 · 尼日利亚",
      "Sell gift cards with clear rates and fast support.": "用清晰汇率和快速支持出售礼品卡。",
      "Card Cosmic helps Nigerian traders check daily rates, download the app, and start supported gift card trades without confusing middlemen.": "Card Cosmic 帮助尼日利亚用户查看每日汇率、下载 App，并更清楚地开始支持的礼品卡交易。",
      "Popular rates": "热门汇率",
      "Check high-demand gift cards.": "查看高需求礼品卡。",
      "Supported gift card brands": "支持的礼品卡品牌",
      "Promotional rates": "宣传汇率",
      "Turn popular cards into strong Naira value.": "把热门礼品卡变成更有吸引力的奈拉价值。",
      "Rate board": "汇率表",
      "Example high-rate table for promotions.": "用于宣传的高汇率示例表。",
      "Creator videos": "达人推广视频",
      "Scrollable video preview for promotions.": "可横向滚动的视频预览区。",
      "Start with the app": "从 App 开始",
      "Ready to check your gift card rate?": "准备查看你的礼品卡汇率了吗？",
      "Download Card Cosmic or message support for current rate guidance.": "下载 Card Cosmic，或联系客服获取当前汇率指导。",
      "Daily rate": "每日汇率",
      "Ask in app": "App 内咨询",
      "Read brief": "阅读摘要",
      "discussions": "条讨论",
      "Trending": "热门",
      "Visit source": "访问来源",
      "Open signal": "打开信号"
    },
    ja: {
      "Rates": "レート",
      "How it works": "使い方",
      "Sell Gift Cards": "ギフトカードを売る",
      "Blog": "記事",
      "Videos": "動画",
      "FAQ": "よくある質問",
      "WhatsApp": "WhatsApp",
      "Download App": "アプリをダウンロード",
      "View rates": "レートを見る",
      "Ask for live rate": "最新レートを確認",
      "Ask for today’s quote": "本日の見積もりを確認",
      "Open full rates": "全レートを見る",
      "Open video page": "動画ページを開く",
      "Chat on WhatsApp": "WhatsAppで相談",
      "Gift cards to Naira · Nigeria": "ギフトカードをナイラへ · ナイジェリア",
      "Sell gift cards with clear rates and fast support.": "明確なレートと素早いサポートでギフトカードを売却。",
      "Card Cosmic helps Nigerian traders check daily rates, download the app, and start supported gift card trades without confusing middlemen.": "Card Cosmicはナイジェリアのユーザーが毎日のレートを確認し、アプリをダウンロードして、対応ギフトカードの取引を始めるのをサポートします。",
      "Popular rates": "人気レート",
      "Check high-demand gift cards.": "需要の高いギフトカードを確認。",
      "Supported gift card brands": "対応ギフトカードブランド",
      "Promotional rates": "プロモーションレート",
      "Turn popular cards into strong Naira value.": "人気カードを魅力的なナイラ価値に。",
      "Rate board": "レート表",
      "Example high-rate table for promotions.": "プロモーション向け高レート例。",
      "Creator videos": "クリエイター動画",
      "Scrollable video preview for promotions.": "横スクロールの動画プレビュー。",
      "Start with the app": "アプリから開始",
      "Ready to check your gift card rate?": "ギフトカードのレートを確認しますか？",
      "Download Card Cosmic or message support for current rate guidance.": "Card Cosmicをダウンロードするか、サポートに最新レートを確認してください。",
      "Daily rate": "日次レート",
      "Ask in app": "アプリで確認",
      "Read brief": "概要を読む",
      "discussions": "件の議論",
      "Trending": "トレンド",
      "Visit source": "ソースを見る",
      "Open signal": "シグナルを開く"
    }
  };

  const languageValues = ["en", "en-GB", "fr", "zh", "ja"];
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    node.originalValue = node.nodeValue;
    textNodes.push(node);
  }

  function setLanguage(lang) {
    const map = translationMaps[lang] || {};
    document.documentElement.lang = lang === "en" ? "en-NG" : lang;
    textNodes.forEach((node) => {
      const original = node.originalValue;
      const trimmed = original.trim();
      const translated = lang === "en" ? trimmed : map[trimmed] || translationMaps["en-GB"]?.[trimmed] || trimmed;
      node.nodeValue = original.replace(trimmed, translated);
    });
    document.querySelectorAll(".language-select").forEach((select) => {
      select.value = lang;
    });
    localStorage.setItem("cardCosmicLanguage", lang);
  }

  document.querySelectorAll(".language-select").forEach((select) => {
    Array.from(select.options).forEach((option, index) => {
      option.value = languageValues[index] || "en";
    });
    select.addEventListener("change", () => setLanguage(select.value));
  });

  setLanguage(localStorage.getItem("cardCosmicLanguage") || "en");
})();
