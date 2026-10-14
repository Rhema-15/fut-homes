// Builds a 1080×1350 share image for a room, in the browser, on a
// canvas. No server, no extra service. Brand: flat violet, amber price
// pill (ink text), Plus Jakarta Sans.

export type ShareCardData = {
  coverUrl: string | null;
  price: string; // "₦250,000"
  roomType: string; // "Self-contain"
  area: string | null;
  distance: string | null; // "1.4 km to Gidan Kwano campus"
  isTrusted: boolean;
  hasVideo: boolean;
  shortLink: string; // "fut-homes.vercel.app/r/9F1C2A"
};

const W = 1080;
const H = 1350;
const PHOTO_H = 780;
const C = {
  brand900: "#2E1A5E",
  brand700: "#4A2C8F",
  brand50: "#EFEAF8",
  amber: "#F2A93B",
  ink: "#1C1530",
  onDarkMuted: "#D9D2EA",
  white: "#FFFFFF",
  scrim: "rgba(28,21,48,0.75)",
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  font: string,
  bg: string,
  fg: string,
  padX: number,
  h: number,
) {
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic";
  return w;
}

export async function makeShareCard(d: ShareCardData): Promise<Blob> {
  await document.fonts.ready;
  // next/font gives the family a generated name; read the real one.
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const f = (weight: number, size: number) => `${weight} ${size}px ${family}`;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background
  ctx.fillStyle = C.brand900;
  ctx.fillRect(0, 0, W, H);

  // Cover photo, cropped to fill
  ctx.fillStyle = C.brand50;
  ctx.fillRect(0, 0, W, PHOTO_H);
  const img = d.coverUrl ? await loadImage(d.coverUrl) : null;
  if (img) {
    const scale = Math.max(W / img.width, PHOTO_H / img.height);
    const sw = W / scale;
    const sh = PHOTO_H / scale;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, PHOTO_H);
  }

  // Pills on the photo
  pill(ctx, 48, 48, "fut homes", f(800, 40), C.white, C.brand700, 28, 76);
  if (d.hasVideo) {
    pill(ctx, 48, PHOTO_H - 48 - 68, "▶  Room video on the link", f(600, 30), C.scrim, C.white, 26, 68);
  }

  // Bottom panel
  const x = 64;
  let y = PHOTO_H + 64;

  // Price pill (amber fill, ink text — brand rule)
  ctx.font = f(800, 64);
  const priceW = ctx.measureText(d.price).width;
  ctx.font = f(600, 34);
  const perW = ctx.measureText(" /year").width;
  const pillW = priceW + perW + 64;
  ctx.fillStyle = C.amber;
  roundRect(ctx, x, y, pillW, 104, 52);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.font = f(800, 64);
  ctx.fillText(d.price, x + 32, y + 76);
  ctx.font = f(600, 34);
  ctx.fillText(" /year", x + 32 + priceW, y + 74);
  y += 104 + 64;

  // Room type + area
  ctx.fillStyle = C.white;
  ctx.font = f(800, 58);
  ctx.fillText(fitText(ctx, [d.roomType, d.area].filter(Boolean).join(" · "), W - x * 2), x, y);
  y += 56;

  // Distance
  if (d.distance) {
    ctx.fillStyle = C.onDarkMuted;
    ctx.font = f(400, 36);
    ctx.fillText(fitText(ctx, d.distance, W - x * 2), x, y);
  }
  y += 44;

  // Badge
  pill(
    ctx,
    x,
    y,
    d.isTrusted ? "✓ Trusted agent" : "✓ ID-checked agent",
    f(600, 30),
    d.isTrusted ? C.brand700 : C.brand50,
    d.isTrusted ? C.white : C.brand700,
    24,
    60,
  );

  // Footer: link + safety line
  ctx.fillStyle = C.white;
  ctx.font = f(800, 36);
  ctx.fillText(d.shortLink, x, H - 92);
  ctx.fillStyle = C.onDarkMuted;
  ctx.font = f(400, 28);
  ctx.fillText("Never pay before you inspect.", x, H - 48);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not make image"))), "image/jpeg", 0.86),
  );
}
