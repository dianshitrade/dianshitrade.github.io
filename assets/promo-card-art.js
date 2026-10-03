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

  // Print artwork and a subtle laminated finish, with no blur on the type.
  ctx.save();
  ctx.fillStyle = item.accent;
  if (item.pattern === "stripe") {
    for (let i = 0; i < 9; i++) ctx.fillRect(520 + i * 68, 0, 28, 640);
  } else if (item.pattern === "spectrum" || item.id === "apple") {
    ["#eb6450", "#e5b644", "#509c6b", "#529fc8", "#8f74ad"].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(585 + i * 76, 160);
      ctx.lineTo(646 + i * 76, 160);
      ctx.lineTo(402 + i * 76, 640);
      ctx.lineTo(341 + i * 76, 640);
      ctx.fill();
    });
  } else {
    ctx.globalAlpha = item.pattern === "foil" ? .38 : .65;
    ctx.beginPath();
    ctx.moveTo(735, -30);
    ctx.lineTo(1120, -30);
    ctx.lineTo(810, 680);
    ctx.lineTo(450, 680);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = .16;
    ctx.fillRect(820, 0, 3, 640);
  }
  ctx.restore();

  // A quiet, opaque print field keeps the brand readable on every pattern.
  ctx.fillStyle = item.background;
  ctx.fillRect(0, 0, 1024, 152);
  ctx.fillRect(0, 330, 1024, 225);
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
  if (logo) ctx.drawImage(logo, 52, 42, 88, 88);
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
  ctx.fillText(title, 54, 420);
  ctx.font = "500 25px Manrope, sans-serif";
  ctx.fillText(item.id === "apple" ? "For everything Apple." : "A world of possibilities.", 57, 478);
  ctx.textAlign = "right";
  ctx.font = "700 22px Manrope, sans-serif";
  ctx.fillText(title, 965, 590);
  return surface;
}
