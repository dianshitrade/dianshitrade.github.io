const viewport = document.querySelector("[data-trades-viewport]");
const track = document.querySelector("[data-trades-track]");
const list = document.querySelector("[data-trades-list]");
const toggle = document.querySelector("[data-trades-toggle]");
const preference = matchMedia("(prefers-reduced-motion: reduce)");

if (viewport && track && list && toggle && track.animate && "ResizeObserver" in window && "IntersectionObserver" in window) {
  let animation, copy, height = 0;
  let visible = false, hovered = false, focused = false, paused = false;
  const speed = 16;
  const offset = () => animation?.playState === "running" ? (Number(animation.currentTime) / 1000 * speed) % height : viewport.scrollTop % height;

  // Transfer the animated offset to native scrolling when a visitor pauses.
  function stop() {
    if (animation?.playState !== "running") return;
    const position = offset();
    animation.pause();
    animation.currentTime = 0;
    viewport.dataset.motion = "paused";
    viewport.scrollTop = position;
  }

  function update() {
    const shouldRun = visible && !document.hidden && !preference.matches && !hovered && !focused && !paused;
    if (shouldRun && animation && animation.playState !== "running") {
      const position = viewport.scrollTop % height;
      viewport.scrollTop = 0;
      animation.currentTime = position / speed * 1000;
      viewport.dataset.motion = "running";
      animation.play();
    } else if (!shouldRun) stop();
    toggle.hidden = preference.matches;
    const label = paused ? "Resume transaction feed" : "Pause transaction feed";
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
    toggle.querySelector("use").setAttribute("href", `assets/promo/motion-icons.svg#${paused ? "play" : "pause"}`);
  }

  function measure() {
    const nextHeight = list.getBoundingClientRect().height;
    if (!nextHeight || nextHeight === height) return;
    stop();
    animation?.cancel();
    height = nextHeight;
    animation = track.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(0,-${height}px,0)` }], { duration: height / speed * 1000, iterations: Infinity, easing: "linear" });
    animation.pause();
    animation.currentTime = 0;
    update();
  }

  function setup() {
    stop();
    animation?.cancel();
    animation = undefined;
    copy?.remove();
    copy = undefined;
    height = 0;
    if (!preference.matches) {
      copy = list.cloneNode(true);
      copy.removeAttribute("data-trades-list");
      copy.setAttribute("aria-hidden", "true");
      copy.inert = true;
      copy.querySelectorAll("[data-record]").forEach(row => row.removeAttribute("data-record"));
      track.append(copy);
      measure();
    }
    update();
  }

  toggle.addEventListener("click", () => { paused = !paused; update(); });
  viewport.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") { hovered = true; update(); } });
  viewport.addEventListener("pointerleave", () => { hovered = false; update(); });
  viewport.addEventListener("pointerdown", event => { if (event.pointerType !== "mouse") { paused = true; update(); } });
  viewport.addEventListener("focusin", () => { focused = true; update(); });
  viewport.addEventListener("focusout", event => { focused = viewport.contains(event.relatedTarget); update(); });
  document.addEventListener("visibilitychange", update);
  preference.addEventListener("change", setup);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .15 }).observe(viewport);
  new ResizeObserver(() => { if (!preference.matches) measure(); }).observe(list);
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", update);
  setup();
}
