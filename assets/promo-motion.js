import { cardDefinitions, createCardArtwork } from "./promo-card-art.js?v=20261003-cards";

const stage = document.querySelector("[data-card-scene]");
const toggle = document.querySelector("[data-motion-toggle]");
const controls = document.querySelector("[data-scene-controls]");
const select = document.querySelector("[data-scene-select]");
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
    const THREE = await import("./promo/vendor/three.js?v=20261003-cards");
    if (!motionPreference.matches) sceneController = await createScene(THREE);
  } catch (_) {
    stage.dataset.state = "fallback";
    toggle.hidden = controls.hidden = true;
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
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "default" });
  const definitions = cardDefinitions();
  const count = definitions.length;
  const cache = new Map();
  const sharedTextures = [];
  const geometries = [], materials = [], cards = [];
  const listeners = new AbortController();
  let resizeObserver, visibilityObserver, environment;
  let frame = 0, disposed = false, visible = false, paused = false, mobile = false;
  let lastFrame = 0, elapsed = 0, position = 0, target = 0, hover = -1;
  let interactionUntil = 0, advanceAt = 8, dragging = null;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const wrap = value => T.MathUtils.euclideanModulo(value, count);
  const offset = (index, center) => wrap(index - center + count / 2) - count / 2;

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    listeners.abort();
    cache.forEach(texture => texture.dispose());
    sharedTextures.forEach(texture => texture.dispose());
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    environment?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    stage.dataset.state = "fallback";
    delete stage.dataset.dragging;
    stage.removeAttribute("tabindex");
    stage.removeAttribute("aria-roledescription");
    stage.setAttribute("role", "img");
    stage.setAttribute("aria-label", "Gift card illustrations from the 21 brands listed below");
    toggle.hidden = controls.hidden = true;
  }

  try {
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, .1, 60);
    const collection = new T.Group();
    const raycaster = new T.Raycaster();
    const rayPointer = new T.Vector2();
    scene.add(collection);
    const room = new T.RoomEnvironment();
    const pmrem = new T.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .65;
    room.dispose();
    pmrem.dispose();
    scene.add(new T.AmbientLight(0xffffff, .7));
    const keyLight = new T.DirectionalLight(0xffffff, 1.7);
    keyLight.position.set(-5, 6, 9);
    scene.add(keyLight);

    const shape = new T.Shape();
    const w = 3.2, h = 2, r = .095, x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const bodyGeometry = new T.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .009, bevelThickness: .007, curveSegments: 12 });
    const faceGeometry = new T.ShapeGeometry(shape, 12);
    geometries.push(bodyGeometry, faceGeometry);
    const positions = faceGeometry.attributes.position;
    const uv = faceGeometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) uv.setXY(i, (positions.getX(i) + w / 2) / w, (positions.getY(i) + h / 2) / h);

    const paper = document.createElement("canvas");
    paper.width = 256;
    paper.height = 160;
    const paperContext = paper.getContext("2d");
    const grain = paperContext.createImageData(256, 160);
    let seed = 17;
    for (let i = 0; i < grain.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = 185 + seed % 70;
      grain.data[i + 3] = 255;
    }
    paperContext.putImageData(grain, 0, 0);
    const paperTexture = new T.CanvasTexture(paper);
    const shadow = document.createElement("canvas");
    shadow.width = 512;
    shadow.height = 320;
    const shadowContext = shadow.getContext("2d");
    shadowContext.shadowColor = "#161b2859";
    shadowContext.shadowBlur = 20;
    shadowContext.shadowOffsetY = 9;
    shadowContext.fillStyle = "#161b28";
    shadowContext.beginPath();
    shadowContext.roundRect(40, 32, 432, 256, 12);
    shadowContext.fill();
    const shadowTexture = new T.CanvasTexture(shadow);
    sharedTextures.push(paperTexture, shadowTexture);
    const shadowMaterial = new T.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .28 });
    materials.push(shadowMaterial);

    await document.fonts.ready;
    const logos = await Promise.all(definitions.map(async item => {
      const logo = new Image();
      logo.src = item.logo;
      try { await logo.decode(); return logo; } catch (_) { return null; }
    }));
    if (disposed || motionPreference.matches) { dispose(); return null; }

    for (let i = 0; i < count; i++) {
      const item = definitions[i];
      const bodyMaterial = new T.MeshPhysicalMaterial({ color: item.background, metalness: .28, roughness: .32, clearcoat: .6 });
      const faceMaterial = new T.MeshPhysicalMaterial({ roughness: .68, roughnessMap: paperTexture, bumpMap: paperTexture, bumpScale: .0006, metalness: 0, clearcoat: .32, clearcoatRoughness: .4, envMapIntensity: .08, specularIntensity: .14 });
      materials.push(bodyMaterial, faceMaterial);
      const card = new T.Group();
      card.add(new T.Mesh(bodyGeometry, bodyMaterial));
      const face = new T.Mesh(faceGeometry, faceMaterial);
      face.position.z = .034;
      face.userData.index = i;
      card.add(face);
      const cardShadow = new T.Mesh(faceGeometry, shadowMaterial);
      cardShadow.position.set(0, -.025, -.1);
      cardShadow.scale.set(1.2, 1.2, 1);
      card.add(cardShadow);
      card.userData.face = face;
      card.userData.lift = 0;
      collection.add(card);
      cards.push(card);
    }

    // Retain only nearby GPU textures. Artwork is rasterized on selection, never every frame.
    function prepare(center) {
      const required = new Set();
      const radius = mobile ? 2 : 3;
      for (let n = -radius; n <= radius; n++) required.add(wrap(Math.round(center) + n));
      for (const i of required) {
        if (!cache.has(i)) {
          const texture = new T.CanvasTexture(createCardArtwork(definitions[i], logos[i]));
          texture.colorSpace = T.SRGBColorSpace;
          texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          cache.set(i, texture);
          cards[i].userData.face.material.map = texture;
          cards[i].userData.face.material.needsUpdate = true;
          renderer.initTexture(texture);
        }
      }
      for (const [i, texture] of cache) {
        if (required.has(i) || Math.abs(offset(i, position)) <= radius + 1) continue;
        cards[i].userData.face.material.map = null;
        cards[i].userData.face.material.needsUpdate = true;
        texture.dispose();
        cache.delete(i);
      }
    }

    function updateSelection(announce = false) {
      const i = wrap(Math.round(target));
      select.value = String(i);
      document.querySelector("[data-scene-count]").textContent = `${String(i + 1).padStart(2, "0")} / ${count}`;
      stage.dataset.activeBrand = definitions[i].id;
      stage.setAttribute("aria-label", `${definitions[i].name} gift card, ${i + 1} of ${count}`);
      if (announce) document.querySelector("[data-scene-announcement]").textContent = `${definitions[i].name}, ${i + 1} of ${count}`;
    }

    function choose(value, manual = true) {
      target = value;
      // Menu jumps glide one card into focus instead of rushing through a dozen brands.
      if (Math.abs(target - position) > 2) position = target - Math.sign(target - position) * 1.25;
      prepare(target);
      updateSelection(manual);
      if (manual) interactionUntil = elapsed + 12;
      advanceAt = elapsed + 8;
      if (manual) resume();
    }

    function pose(dt = 1) {
      const smoothing = 1 - Math.exp(-9 * dt);
      cards.forEach((card, i) => {
        const d = offset(i, position), distance = Math.abs(d);
        card.visible = distance < (mobile ? 2.1 : 3.2) && cache.has(i);
        if (!card.visible) return;
        const focus = Math.max(0, 1 - distance);
        card.userData.lift += ((hover === i ? .12 : 0) - card.userData.lift) * smoothing;
        card.position.set(d * (mobile ? 1.82 : 2.05), -.05 - distance * .10 + Math.sin(elapsed * .65 + i) * .035 + card.userData.lift, 1 - distance * .72);
        card.rotation.set(-.035 + pointer.y * .11 * focus, -Math.sign(d) * Math.min(distance, 1.8) * .18 + pointer.x * .16 * focus, -d * .045);
        card.scale.setScalar(1 + focus * .035);
      });
    }

    function draw(time) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const dt = lastFrame ? Math.min((time - lastFrame) / 1000, .05) : 1 / 60;
      lastFrame = time;
      if (!paused) elapsed += dt;
      if (!paused && !dragging && hover < 0 && !stage.matches(":focus-within") && !controls.matches(":focus-within") && elapsed >= Math.max(advanceAt, interactionUntil)) choose(Math.round(target) + 1, false);
      const smoothing = 1 - Math.exp(-8.5 * dt);
      position += (target - position) * smoothing;
      pointer.x += (pointer.targetX - pointer.x) * smoothing;
      pointer.y += (pointer.targetY - pointer.y) * smoothing;
      pose(dt);
      renderer.render(scene, camera);
      const settling = Math.abs(target - position) > .0005 || Math.abs(pointer.x - pointer.targetX) + Math.abs(pointer.y - pointer.targetY) > .0005 || cards.some((card, i) => card.visible && Math.abs(card.userData.lift - (hover === i ? .12 : 0)) > .0005);
      if (!paused || settling) frame = requestAnimationFrame(draw);
    }

    function resume() {
      if (!frame && !disposed && visible && !document.hidden) { lastFrame = 0; frame = requestAnimationFrame(draw); }
    }

    function resize() {
      if (disposed) return;
      const width = stage.clientWidth, height = stage.clientHeight;
      mobile = width <= 640;
      // Retina fidelity with a bounded framebuffer on wide/high-density screens.
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 3 : 2, Math.sqrt(3500000 / (width * height))));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const sceneWidth = mobile ? 4.65 : width <= 900 ? 9 : 13.2;
      camera.position.z = Math.max(mobile ? 3.6 : 4.5, sceneWidth / camera.aspect) / (2 * Math.tan(32 * Math.PI / 360)) + 1;
      camera.updateProjectionMatrix();
      prepare(target);
      pose();
      renderer.render(scene, camera);
      resume();
    }

    function hit(event) {
      const rect = stage.getBoundingClientRect();
      rayPointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      raycaster.setFromCamera(rayPointer, camera);
      return raycaster.intersectObjects(cards.filter(card => card.visible).map(card => card.userData.face))[0]?.object.userData.index ?? -1;
    }

    function setControl() {
      const label = paused ? "Play gift card animation" : "Pause gift card animation";
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      toggle.querySelector("use").setAttribute("href", `assets/promo/motion-icons.svg#${paused ? "play" : "pause"}`);
    }

    const options = { signal: listeners.signal };
    select.replaceChildren(...definitions.map((item, i) => new Option(item.name, String(i))));
    select.addEventListener("change", () => choose(Math.round(target) + offset(Number(select.value), Math.round(target))), options);
    document.querySelector("[data-scene-prev]").addEventListener("click", () => choose(Math.round(target) - 1), options);
    document.querySelector("[data-scene-next]").addEventListener("click", () => choose(Math.round(target) + 1), options);
    toggle.addEventListener("click", () => { paused = !paused; setControl(); resume(); }, options);
    stage.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      choose(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : Math.round(target) + (event.key === "ArrowLeft" ? -1 : 1));
    }, options);
    stage.addEventListener("pointerdown", event => {
      if (event.button !== 0 || (dragging && dragging.id !== event.pointerId)) return;
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, start: target, moved: false, index: hit(event) };
      stage.setPointerCapture(event.pointerId);
      interactionUntil = elapsed + 12;
    }, options);
    stage.addEventListener("pointermove", event => {
      if (dragging && event.pointerId === dragging.id) {
        const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
        if (!dragging.moved && Math.abs(dx) < Math.max(8, Math.abs(dy))) return;
        dragging.moved = true;
        stage.dataset.dragging = "true";
        target = dragging.start - T.MathUtils.clamp(dx / (mobile ? 160 : 260), -1.5, 1.5);
        prepare(target);
        resume();
      } else if (event.pointerType === "mouse") {
        hover = hit(event);
        pointer.targetX = rayPointer.x;
        pointer.targetY = -rayPointer.y;
        resume();
      }
    }, options);
    function finishDrag(event) {
      if (!dragging || event.pointerId !== dragging.id) return;
      const gesture = dragging;
      dragging = null;
      delete stage.dataset.dragging;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      if (event.type === "pointercancel") choose(Math.round(gesture.start));
      else if (gesture.moved) {
        const shift = target - gesture.start;
        choose(Math.round(gesture.start) + (Math.abs(shift) > .2 ? Math.sign(shift) * Math.max(1, Math.round(Math.abs(shift))) : 0));
      } else if (gesture.index >= 0) choose(Math.round(target) + Math.round(offset(gesture.index, target)));
      hover = -1;
    }
    stage.addEventListener("pointerup", finishDrag, options);
    stage.addEventListener("pointercancel", finishDrag, options);
    stage.addEventListener("lostpointercapture", event => { if (dragging?.id === event.pointerId) finishDrag({ pointerId: event.pointerId, type: "pointercancel" }); }, options);
    stage.addEventListener("pointerleave", () => { hover = -1; pointer.targetX = pointer.targetY = 0; resume(); }, options);
    document.addEventListener("visibilitychange", () => { cancelAnimationFrame(frame); frame = 0; resume(); }, options);
    renderer.domElement.addEventListener("webglcontextlost", event => { event.preventDefault(); dispose(); }, options);
    window.addEventListener("pagehide", event => { if (!event.persisted) dispose(); else { cancelAnimationFrame(frame); frame = 0; } }, options);
    window.addEventListener("pageshow", resume, options);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; cancelAnimationFrame(frame); frame = 0; resume(); });
    visibilityObserver.observe(stage);
    stage.appendChild(renderer.domElement);
    stage.tabIndex = 0;
    stage.setAttribute("role", "group");
    stage.setAttribute("aria-roledescription", "carousel");
    resize();
    updateSelection();
    stage.dataset.state = "ready";
    toggle.hidden = controls.hidden = false;
    setControl();
    return { dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
