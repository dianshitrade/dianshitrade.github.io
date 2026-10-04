// Original brand illustrations, not redeemable cards or live offers.
const styles = {
  apple: ["#f5f5f3", "#25262b", "#c9cbd2", "foil"],
  steam: ["#12344a", "#ffffff", "#46bdd9", "diagonal"],
  razergold: ["#191d19", "#f5cf62", "#d3a530", "foil"],
  sephora: ["#f4f3f1", "#202124", "#252629", "stripe"],
  ebay: ["#ffffff", "#24262c", "#376abe", "spectrum"],
  xbox: ["#126c28", "#ffffff", "#80b941", "diagonal"],
  googleplay: ["#f4f7f5", "#253c36", "#3b9473", "spectrum"],
  amazon: ["#252c35", "#ffffff", "#efa833", "diagonal"],
  amex: ["#1c5892", "#ffffff", "#97caec", "foil"],
  vanilla: ["#f8f5f1", "#a92534", "#c83242", "diagonal"],
  visa: ["#f6f7fa", "#244c94", "#dcad43", "foil"],
  target: ["#b21f31", "#ffffff", "#e85965", "diagonal"],
  walmart: ["#126ab5", "#ffffff", "#fac53d", "diagonal"],
  footlocker: ["#292a2d", "#ffffff", "#ed4b46", "stripe"],
  gamestop: ["#f5f5f4", "#232329", "#c12f35", "diagonal"],
  macys: ["#bb293c", "#ffffff", "#e28a98", "foil"],
  nordstrom: ["#29292e", "#ffffff", "#9598a5", "stripe"],
  playstation: ["#144895", "#ffffff", "#43a5e0", "diagonal"],
  roblox: ["#25282b", "#ffffff", "#b8c2c9", "diagonal"],
  kohls: ["#f6f4f7", "#532951", "#a26c9c", "foil"],
  cvs: ["#faf5f3", "#ae2532", "#d66a6c", "diagonal"]
};

export function cardDefinitions() {
  const order = ["apple", "steam", "xbox", "razergold", "playstation", "sephora", "amex", "vanilla", "visa", "target", "walmart", "footlocker", "gamestop", "macys", "nordstrom", "roblox", "kohls", "cvs", "googleplay", "amazon", "ebay"];
  return Array.from(document.querySelectorAll(".card-grid a"), link => {
    const id = link.dataset.placement.replace("card-", "");
    const [background, ink, accent, pattern] = styles[id];
    return { id, name: link.querySelector("span").textContent, logo: link.querySelector("img").src, background, ink, accent, pattern };
  }).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

export function createCardArtwork(item, logo) {
  const surface = document.createElement("canvas");
  surface.width = 1536;
  surface.height = 960;
  const ctx = surface.getContext("2d");
  ctx.scale(1.5, 1.5);
  ctx.fillStyle = item.background;
  ctx.fillRect(0, 0, 1024, 640);

  // Issuer-specific motifs are drawn once at texture resolution, never per frame.
  ctx.save();
  ctx.fillStyle = item.accent;
  const brandCenter = ["apple", "ebay", "googleplay"].includes(item.id);
  if (brandCenter) {
    drawBrandMark(ctx, item.id);
  } else if (["sephora", "footlocker", "nordstrom"].includes(item.id)) {
    const stripeWidth = item.id === "nordstrom" ? 2 : 30;
    ctx.globalAlpha = item.id === "nordstrom" ? .35 : 1;
    for (let i = 0; i < 9; i++) ctx.fillRect(550 + i * 62, 0, stripeWidth, 470);
  } else if (item.id === "target") {
    [160, 108, 54].forEach((radius, i) => {
      ctx.fillStyle = i % 2 ? item.background : "#ffffff";
      ctx.beginPath(); ctx.arc(745, 260, radius, 0, Math.PI * 2); ctx.fill();
    });
  } else if (item.id === "walmart") {
    ctx.translate(748, 252);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.roundRect(-17, 55, 34, 100, 16); ctx.fill();
    }
  } else if (item.id === "roblox") {
    ctx.translate(748, 250); ctx.rotate(.24);
    ctx.fillStyle = "#eeeeee"; ctx.fillRect(-126, -126, 252, 252);
    ctx.fillStyle = item.background; ctx.fillRect(-45, -45, 90, 90);
  } else if (item.id === "playstation") {
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#82ddd1";
    ctx.beginPath(); ctx.moveTo(590, 115); ctx.lineTo(665, 245); ctx.lineTo(515, 245); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = "#ed9bbb"; ctx.beginPath(); ctx.arc(830, 185, 65, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#88b9ec"; ctx.beginPath(); ctx.moveTo(537, 300); ctx.lineTo(650, 413); ctx.moveTo(650, 300); ctx.lineTo(537, 413); ctx.stroke();
    ctx.strokeStyle = "#ddaff0"; ctx.strokeRect(767, 301, 125, 125);
  } else if (item.id === "xbox") {
    ctx.strokeStyle = "#a4d87d"; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.arc(750, 255, 155, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.font = "700 250px Arial, sans-serif"; ctx.textAlign = "center"; ctx.fillText("X", 750, 337);
  } else if (item.id === "amazon") {
    ctx.strokeStyle = item.accent; ctx.lineWidth = 20; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(538, 243); ctx.quadraticCurveTo(700, 379, 909, 225); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(862, 219); ctx.lineTo(918, 212); ctx.lineTo(910, 265); ctx.stroke();
  } else if (item.id === "macys") {
    ctx.fillStyle = "#ffffff"; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 66 : 156; ctx.lineTo(746 + Math.cos(a) * r, 260 + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  } else if (item.id === "cvs") {
    ctx.translate(747, 266); ctx.beginPath(); ctx.moveTo(0, 135); ctx.bezierCurveTo(-240, -5, -110, -190, 0, -77); ctx.bezierCurveTo(110, -190, 240, -5, 0, 135); ctx.fill();
  } else if (item.id === "razergold") {
    ctx.strokeStyle = item.accent; ctx.lineWidth = 7;
    for (const r of [112, 146]) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(747 + Math.cos(a) * r, 255 + Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); }
    ctx.font = "800 130px Manrope, sans-serif"; ctx.textAlign = "center"; ctx.fillText("G", 747, 301);
  } else if (item.id === "steam") {
    ctx.strokeStyle = "#5fa9c1"; ctx.lineWidth = 32;
    ctx.beginPath(); ctx.arc(815, 184, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(757, 234); ctx.lineTo(644, 339); ctx.lineTo(515, 292); ctx.stroke();
    ctx.beginPath(); ctx.arc(642, 340, 42, 0, Math.PI * 2); ctx.stroke();
  } else if (item.id === "gamestop") {
    for (let x = 0; x < 5; x++) for (let y = 0; y < 4; y++) { ctx.globalAlpha = (x + y) % 2 ? .18 : .8; ctx.fillRect(560 + x * 68, 115 + y * 68, 53, 53); }
  } else if (item.id === "visa") {
    ctx.fillStyle = "#183c83"; ctx.fillRect(0, 150, 1024, 100);
    ctx.fillStyle = "#e5b344"; ctx.fillRect(0, 285, 1024, 100);
  } else if (item.id === "amex") {
    ctx.strokeStyle = "#b3d9ea"; ctx.lineWidth = 1.4; ctx.globalAlpha = .55;
    for (let i = 0; i < 15; i++) { ctx.beginPath(); ctx.ellipse(750, 255, 30 + i * 11, 75 + i * 5, .5, 0, Math.PI * 2); ctx.stroke(); }
  } else if (item.id === "vanilla") {
    ctx.fillStyle = item.ink; ctx.font = "400 285px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText("V", 738, 350);
  } else if (item.id === "kohls") {
    ctx.strokeStyle = item.accent; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(749, 180); ctx.bezierCurveTo(470, -60, 480, 410, 749, 180); ctx.bezierCurveTo(995, -60, 1015, 410, 749, 180); ctx.moveTo(749, 180); ctx.lineTo(655, 410); ctx.moveTo(749, 180); ctx.lineTo(841, 410); ctx.stroke();
  } else {
    ctx.globalAlpha = .3; ctx.fillRect(520, 150, 480, 230);
  }
  ctx.restore();

  // The brand mark remains unobscured; secondary text has its own printed area.
  ctx.fillStyle = item.background;
  ctx.fillRect(0, 0, 1024, 112);
  ctx.fillRect(0, 450, 1024, 190);
  const laminate = ctx.createLinearGradient(0, 0, 1024, 640);
  laminate.addColorStop(0, "#ffffff25");
  laminate.addColorStop(.4, "#ffffff00");
  laminate.addColorStop(.7, "#ffffff12");
  laminate.addColorStop(1, "#00000012");
  ctx.fillStyle = laminate;
  ctx.fillRect(0, 0, 1024, 640);

  ctx.strokeStyle = item.ink + "40";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(16, 16, 992, 608, 22);
  ctx.stroke();
  if (logo && !brandCenter) ctx.drawImage(logo, 52, 42, 88, 88);
  ctx.fillStyle = item.ink;
  ctx.textAlign = "right";
  ctx.font = "700 20px Manrope, sans-serif";
  ctx.fillText("GIFT CARD", 968, 88);
  ctx.textAlign = "left";
  const title = item.id === "amex" ? "American Express" : item.id === "nordstrom" ? "Nordstrom" : item.name;
  let size = 64;
  ctx.font = `800 ${size}px Manrope, sans-serif`;
  while (ctx.measureText(title).width > 900 && size > 40) {
    ctx.font = `800 ${--size}px Manrope, sans-serif`;
  }
  ctx.fillText(title, 54, 524);
  ctx.font = "500 25px Manrope, sans-serif";
  const captions = { apple: "Apps. Music. Entertainment.", ebay: "Find your next favourite.", googleplay: "Apps. Games. More to play.", steam: "Your next game starts here.", xbox: "A new way to play.", playstation: "Your next adventure awaits.", amazon: "Something for everyone.", sephora: "A little more beauty.", razergold: "Power up your next game." };
  ctx.fillText(captions[item.id] || "Gift more possibilities.", 57, 580);
  return surface;
}

// Vector brand silhouettes from Simple Icons (CC0); colours follow the supplied logos.
function drawBrandMark(ctx, id) {
  if (id === "apple") {
    const mark = new Path2D("M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701");
    ctx.translate(392, 146); ctx.scale(10, 10); ctx.fillStyle = "#242529"; ctx.fill(mark);
  } else if (id === "googleplay") {
    ctx.translate(391, 145); ctx.scale(10.5, 10.5);
    const pieces = [
      ["#fbbc04", "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z"],
      ["#4285f4", "M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924z"],
      ["#34a853", "M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973z"],
      ["#ea4335", "M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"]
    ];
    for (const [color, path] of pieces) { ctx.fillStyle = color; ctx.fill(new Path2D(path)); }
  } else {
    const mark = new Path2D("M6.056 12.132v-4.92h1.2v3.026c.59-.703 1.402-.906 2.202-.906 1.34 0 2.828.904 2.828 2.855 0 .233-.015.457-.06.668.24-.953 1.274-1.305 2.896-1.344.51-.018 1.095-.018 1.56-.018v-.135c0-.885-.556-1.244-1.53-1.244-.72 0-1.245.3-1.305.81h-1.275c.136-1.29 1.5-1.62 2.686-1.62 1.064 0 1.995.27 2.415 1.02l-.436-.84h1.41l2.055 4.125 2.055-4.126H24l-3.72 7.305h-1.346l1.07-2.04-2.33-4.38c.13.255.2.555.2.93v2.46c0 .346.01.69.04 1.005H16.8a6.543 6.543 0 01-.046-.765c-.603.734-1.32.96-2.32.96-1.48 0-2.272-.78-2.272-1.695 0-.15.015-.284.037-.405-.3 1.246-1.36 2.086-2.767 2.086-.87 0-1.694-.315-2.2-.93 0 .24-.015.494-.04.734h-1.18c.02-.39.04-.855.04-1.245v-1.05h-4.83c.065 1.095.818 1.74 1.853 1.74.718 0 1.355-.3 1.568-.93h1.24c-.24 1.29-1.61 1.725-2.79 1.725C.95 15.009 0 13.822 0 12.232c0-1.754.982-2.91 3.116-2.91 1.688 0 2.93.886 2.94 2.806v.005zm9.137.183c-1.095.034-1.77.233-1.77.95 0 .465.36.97 1.305.97 1.26 0 1.935-.69 1.935-1.814v-.13c-.45 0-.99.006-1.484.022h.012zm-6.06 1.875c1.11 0 1.876-.806 1.876-2.02s-.768-2.02-1.893-2.02c-1.11 0-1.89.806-1.89 2.02s.765 2.02 1.875 2.02h.03zm-4.35-2.514c-.044-1.125-.854-1.546-1.725-1.546-.944 0-1.694.474-1.815 1.546z");
    ctx.translate(180, -40); ctx.scale(27.7, 27.7);
    const stops = [[0, 6.05, "#e53238"], [6.05, 12.18, "#0064d2"], [12.18, 17.72, "#f5af02"], [17.72, 24, "#79a520"]];
    for (const [start, end, color] of stops) {
      ctx.save(); ctx.beginPath(); ctx.rect(start, 0, end - start, 24); ctx.clip(); ctx.fillStyle = color; ctx.fill(mark); ctx.restore();
    }
  }
}
