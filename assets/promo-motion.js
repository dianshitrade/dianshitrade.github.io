const stage = document.querySelector("[data-card-scene]");
const toggle = document.querySelector("[data-motion-toggle]");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let sceneController;
let loading = false;
let nearby = false;
let loadAttempted = false;

if ("IntersectionObserver" in window && !motionPreference.matches) {
  const reveals = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (motionPreference.matches) continue;
      const animation = entry.target.animate([{ opacity: .4, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
      reveals.add(animation);
      animation.onfinish = () => reveals.delete(animation);
    }
  }, { threshold: .15 });
  document.querySelectorAll(".why-intro, .benefit, .download-intro").forEach(element => observer.observe(element));
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) { reveals.forEach(animation => animation.cancel()); reveals.clear(); }
  });
}

async function loadScene() {
  if (!stage || sceneController || loading || loadAttempted || !nearby || motionPreference.matches || navigator.connection?.saveData) return;
  loading = true;
  loadAttempted = true;
  try {
    const THREE = await import("./promo/vendor/three.js");
    if (!motionPreference.matches) sceneController = await createScene(THREE);
  } catch (_) {
    stage.dataset.state = "fallback";
    toggle.hidden = true;
  } finally {
    loading = false;
    if (!loadAttempted) void loadScene();
  }
}

if (stage && "IntersectionObserver" in window) {
  const loader = new IntersectionObserver(([entry]) => {
    nearby = entry.isIntersecting;
    void loadScene();
  }, { rootMargin: "300px" });
  loader.observe(stage);
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) {
      sceneController?.dispose();
      sceneController = null;
      loadAttempted = false;
    } else { void loadScene(); }
  });
}

async function createScene(T) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  const textures = [];
  const geometries = [];
  const materials = [];
  const cards = [];
  const listeners = new AbortController();
  let resizeObserver;
  let visibilityObserver;
  let frame = 0;
  let disposed = false;
  let visible = false;
  let paused = false;
  let mobile = false;
  let lastFrame = 0;
  let elapsed = 0;
  let scrollDirty = true;
  let scrollProgress = .5;
  let spread = .8;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    listeners.abort();
    textures.forEach(texture => texture.dispose());
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    stage.dataset.state = "fallback";
    toggle.hidden = true;
  }

  try {
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(33, 1, .1, 60);
    const collection = new T.Group();
    scene.add(collection);
    scene.add(new T.AmbientLight(0xffffff, 2));
    const keyLight = new T.DirectionalLight(0xffffff, 3);
    keyLight.position.set(-3, 5, 8);
    scene.add(keyLight);

    const shape = new T.Shape();
    const w = 3.2, h = 2, r = .13, x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const bodyGeometry = new T.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .014, bevelThickness: .012, curveSegments: 8 });
    const faceGeometry = new T.ShapeGeometry(shape, 8);
    geometries.push(bodyGeometry, faceGeometry);
    const positions = faceGeometry.attributes.position;
    const uv = faceGeometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) uv.setXY(i, (positions.getX(i) + w / 2) / w, (positions.getY(i) + h / 2) / h);

    const definitions = [
      { id: "ebay", name: "eBay", background: "#f4ede4", accent: "#a16b29" },
      { id: "steam", name: "Steam", background: "#e7eef5", accent: "#24536f" },
      { id: "apple", name: "Apple / iTunes", background: "#f6f6f7", accent: "#272931" },
      { id: "xbox", name: "Xbox", background: "#e5f0e8", accent: "#19713b" },
      { id: "razergold", name: "Razer Gold", background: "#fff0c0", accent: "#936300" }
    ];
    await document.fonts.ready;
    for (const item of definitions) {
      if (motionPreference.matches) { dispose(); return null; }
      const logo = new Image();
      logo.src = new URL(`./promo/${item.id}.png`, import.meta.url).href;
      await logo.decode();
      const surface = document.createElement("canvas");
      surface.width = 960;
      surface.height = 600;
      const ctx = surface.getContext("2d");
      ctx.fillStyle = item.background;
      ctx.fillRect(0, 0, 960, 600);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, 912, 552);
      const alignRight = item.id === "xbox" || item.id === "razergold";
      ctx.drawImage(logo, alignRight ? 767 : 65, 68, 128, 128);
      ctx.fillStyle = item.accent;
      ctx.font = "800 25px Manrope, sans-serif";
      ctx.textAlign = alignRight ? "left" : "right";
      ctx.fillText("GIFT CARD", alignRight ? 65 : 892, 100);
      ctx.textAlign = alignRight ? "right" : "left";
      ctx.font = "750 57px Manrope, sans-serif";
      ctx.fillText(item.name, alignRight ? 895 : 65, 423);
      ctx.font = "500 24px Manrope, sans-serif";
      ctx.fillText("Your next move starts here.", alignRight ? 895 : 68, 480);
      const texture = new T.CanvasTexture(surface);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      textures.push(texture);
      const bodyMaterial = new T.MeshPhysicalMaterial({ color: item.background, metalness: .15, roughness: .33, clearcoat: .4 });
      const faceMaterial = new T.MeshBasicMaterial({ map: texture });
      materials.push(bodyMaterial, faceMaterial);
      const card = new T.Group();
      card.add(new T.Mesh(bodyGeometry, bodyMaterial));
      const face = new T.Mesh(faceGeometry, faceMaterial);
      face.position.z = .06;
      card.add(face);
      collection.add(card);
      cards.push(card);
    }
    if (motionPreference.matches) { dispose(); return null; }
    stage.appendChild(renderer.domElement);

    function pose() {
      cards.forEach((card, i) => {
        const offset = i - 2;
        card.visible = !mobile || Math.abs(offset) < 2;
        card.position.set(offset * (mobile ? 1.38 : 1.82) * spread, Math.abs(offset) * .16 + Math.sin(elapsed * .65 + i) * .07, .9 - Math.abs(offset) * .48);
        card.rotation.set(-.055 + Math.sin(elapsed * .45 + i) * .025, -offset * .09, offset * -.115 + Math.sin(elapsed * .35 + i) * .015);
      });
      collection.rotation.set(pointer.y * .065, pointer.x * .09, 0);
      collection.position.y = -.13;
    }

    function draw(time) {
      frame = 0;
      if (disposed || paused || !visible || document.hidden) return;
      const dt = lastFrame ? Math.min((time - lastFrame) / 1000, .04) : 0;
      lastFrame = time;
      elapsed += dt;
      if (scrollDirty) {
        const rect = stage.getBoundingClientRect();
        scrollProgress = T.MathUtils.clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
        scrollDirty = false;
      }
      const smoothing = 1 - Math.exp(-5 * dt);
      spread += (.72 + scrollProgress * .5 - spread) * smoothing;
      pointer.x += (pointer.targetX - pointer.x) * smoothing;
      pointer.y += (pointer.targetY - pointer.y) * smoothing;
      pose();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    }

    function resume() {
      if (!frame && !disposed && !paused && visible && !document.hidden) {
        lastFrame = 0;
        frame = requestAnimationFrame(draw);
      }
    }

    function resize() {
      if (disposed) return;
      const width = stage.clientWidth, height = stage.clientHeight;
      mobile = width <= 640;
      renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const sceneWidth = mobile ? 7.5 : 12.2;
      const sceneHeight = mobile ? 4.3 : 4.7;
      camera.position.z = Math.max(sceneHeight, sceneWidth / camera.aspect) / (2 * Math.tan(33 * Math.PI / 360)) + .9;
      camera.updateProjectionMatrix();
      pose();
      renderer.render(scene, camera);
      scrollDirty = true;
    }

    function setControl() {
      const label = paused ? "Play gift card animation" : "Pause gift card animation";
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      toggle.querySelector("use").setAttribute("href", `assets/promo/motion-icons.svg#${paused ? "play" : "pause"}`);
    }

    const options = { signal: listeners.signal };
    toggle.addEventListener("click", () => {
      paused = !paused;
      cancelAnimationFrame(frame);
      frame = 0;
      setControl();
      resume();
    }, options);
    stage.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || paused) return;
      const rect = stage.getBoundingClientRect();
      pointer.targetX = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointer.targetY = (event.clientY - rect.top) / rect.height * 2 - 1;
    }, options);
    stage.addEventListener("pointerleave", () => { pointer.targetX = pointer.targetY = 0; }, options);
    window.addEventListener("scroll", () => { scrollDirty = true; }, { ...options, passive: true });
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(frame);
      frame = 0;
      resume();
    }, options);
    renderer.domElement.addEventListener("webglcontextlost", event => { event.preventDefault(); dispose(); }, options);
    window.addEventListener("pagehide", event => {
      if (!event.persisted) dispose();
      else { cancelAnimationFrame(frame); frame = 0; }
    }, options);
    window.addEventListener("pageshow", resume, options);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      frame = 0;
      resume();
    });
    visibilityObserver.observe(stage);
    resize();
    stage.dataset.state = "ready";
    toggle.hidden = false;
    setControl();
    return { dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
