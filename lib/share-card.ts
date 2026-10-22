// Builds a share image for a room, in the browser, on a canvas. No server,
// no extra service. Same look as the site: lilac ground, ink outlines with
// hard shadows, yellow/pink/mint stickers, electric violet. The card carries
// every detail a student needs (price, period, gender, what's included, the
// full cost), so the picture works on its own.

export type ShareTag = { text: string; tone: "warn" | "gender" };

export type ShareCardData = {
  coverUrl: string | null;
  price: string; // "₦250,000"
  unit?: string; // "/year" or "/7 months"
  roomType: string; // "Self-contain"
  area: string | null;
  distance: string | null; // "1.4 km to Gidan Kwano campus"
  badge: "trusted" | "verified" | null;
  hasVideo: boolean;
  shortLink: string; // "fut-homes.name.ng/r/9F1C2A"
  code?: string; // "9F1C2A"
  tags?: ShareTag[]; // "Only 7 months, not a full year", "Females only"
  amenities?: string[];
  fees?: { label: string; amount: string }[]; // includes the rent row first
  total?: string;
  feesNote?: string | null;
};

const W = 1080;
const MAX_H = 2200;
const MIN_H = 1350;
const PAD = 56;
const C = {
  ground: "#F3EEFF",
  ink: "#160B33",
  violet: "#5B2BE0",
  lilac: "#E6DCFF",
  yellow: "#FFD23F",
  pink: "#FF7AA8",
  mint: "#A8EBCF",
  error: "#B42318",
  white: "#FFFFFF",
  muted: "#4B3F6B",
  onDarkMuted: "#D4C8F5",
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

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(ctx, kept[maxLines - 1] + " …", maxWidth);
    return kept;
  }
  return lines;
}

// A sticker: ink outline, hard shadow, optional tilt. `inside` draws the
// content with (0,0) at the sticker's top-left corner (already tilted).
function sticker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  opts: { r?: number; tilt?: number; shadow?: number; border?: number } = {},
  inside?: () => void,
) {
  const r = opts.r ?? 22;
  const shadow = opts.shadow ?? 8;
  const border = opts.border ?? 4;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(((opts.tilt ?? 0) * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = C.ink;
  roundRect(ctx, shadow, shadow, w, h, r);
  ctx.fill();
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, border, border, w - border * 2, h - border * 2, Math.max(r - border, 2));
  ctx.fill();
  inside?.();
  ctx.restore();
}

export async function makeShareCard(d: ShareCardData): Promise<Blob> {
  await document.fonts.ready;
  // next/font gives the family a generated name; read the real one.
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const f = (weight: number, size: number) => `${weight} ${size}px ${family}`;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = MAX_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.textBaseline = "alphabetic";

  // Ground
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, 0, W, MAX_H);

  // Header: wordmark + badge
  ctx.fillStyle = C.ink;
  ctx.font = f(800, 68);
  ctx.fillText("fut homes", PAD, 100);
  if (d.badge) {
    ctx.font = f(700, 30);
    const label = "✓ Verified home";
    const bw = ctx.measureText(label).width + 56;
    sticker(ctx, W - PAD - bw - 8, 44, bw, 64, d.badge === "trusted" ? C.violet : C.lilac, { r: 32, shadow: 6, border: 3 }, () => {
      ctx.fillStyle = d.badge === "trusted" ? C.white : C.violet;
      ctx.font = f(700, 30);
      ctx.fillText(label, 28, 42);
    });
  }

  // Photo
  const px = PAD;
  const py = 150;
  const pw = W - PAD * 2 - 10;
  const ph = 540;
  ctx.fillStyle = C.ink;
  roundRect(ctx, px + 10, py + 10, pw, ph, 32);
  ctx.fill();
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 32);
  ctx.clip();
  ctx.fillStyle = C.lilac;
  ctx.fillRect(px, py, pw, ph);
  const img = d.coverUrl ? await loadImage(d.coverUrl) : null;
  if (img) {
    const scale = Math.max(pw / img.width, ph / img.height);
    const sw = pw / scale;
    const sh = ph / scale;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, pw, ph);
  }
  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 6;
  roundRect(ctx, px, py, pw, ph, 32);
  ctx.stroke();
  if (d.hasVideo) {
    ctx.font = f(700, 30);
    const label = "▶  Room video on the link";
    const vw = ctx.measureText(label).width + 52;
    sticker(ctx, px + 28, py + ph - 28 - 64, vw, 64, C.yellow, { r: 20, tilt: -2, shadow: 6, border: 3 }, () => {
      ctx.fillStyle = C.ink;
      ctx.font = f(700, 30);
      ctx.fillText(label, 26, 42);
    });
  }

  let y = py + ph + 64;

  // Price sticker
  const unit = ` ${d.unit ?? "/year"}`;
  ctx.font = f(800, 72);
  const priceW = ctx.measureText(d.price).width;
  ctx.font = f(700, 34);
  const unitW = ctx.measureText(unit).width;
  const priceBoxW = Math.min(W - PAD * 2 - 10, priceW + unitW + 64);
  sticker(ctx, PAD, y, priceBoxW, 116, C.yellow, { r: 28, tilt: -2, shadow: 8 }, () => {
    ctx.fillStyle = C.ink;
    ctx.font = f(800, 72);
    ctx.fillText(d.price, 32, 82);
    ctx.font = f(700, 34);
    ctx.fillText(unit, 32 + priceW, 80);
  });
  y += 116 + 44;

  // Tags: part-year warning, roommate gender
  if (d.tags && d.tags.length > 0) {
    let tx = PAD;
    let rowY = y;
    ctx.font = f(700, 32);
    for (const t of d.tags) {
      const tw = ctx.measureText(t.text).width + 52;
      if (tx + tw > W - PAD - 10 && tx > PAD) {
        tx = PAD;
        rowY += 84;
      }
      sticker(ctx, tx, rowY, tw, 64, t.tone === "warn" ? C.error : C.pink, { r: 20, tilt: t.tone === "warn" ? -1 : 1, shadow: 6, border: 3 }, () => {
        ctx.fillStyle = t.tone === "warn" ? C.white : C.ink;
        ctx.font = f(700, 32);
        ctx.fillText(t.text, 26, 43);
      });
      tx += tw + 24;
    }
    y = rowY + 64 + 44;
  }

  // Room type + area
  ctx.fillStyle = C.ink;
  ctx.font = f(800, 62);
  ctx.fillText(fitText(ctx, [d.roomType, d.area].filter(Boolean).join(" · "), W - PAD * 2), PAD, y + 44);
  y += 62;
  if (d.distance) {
    ctx.fillStyle = C.muted;
    ctx.font = f(500, 34);
    ctx.fillText(fitText(ctx, d.distance, W - PAD * 2), PAD, y + 34);
    y += 34;
  }
  y += 36;

  // What's included
  const am = d.amenities ?? [];
  if (am.length > 0) {
    const shown = am.slice(0, 8);
    const labels = am.length > shown.length ? [...shown, `+${am.length - shown.length} more`] : shown;
    ctx.fillStyle = C.ink;
    ctx.font = f(800, 32);
    ctx.fillText("What's included", PAD, y + 28);
    y += 28 + 20;
    let cx = PAD;
    let rowY = y;
    ctx.font = f(700, 28);
    for (const label of labels) {
      const cw = ctx.measureText(label).width + 40;
      if (cx + cw > W - PAD - 8 && cx > PAD) {
        cx = PAD;
        rowY += 72;
      }
      sticker(ctx, cx, rowY, cw, 52, C.white, { r: 18, shadow: 5, border: 3 }, () => {
        ctx.fillStyle = C.ink;
        ctx.font = f(700, 28);
        ctx.fillText(label, 20, 35);
      });
      cx += cw + 18;
    }
    y = rowY + 52 + 40;
  }

  // Full cost
  const fees = d.fees ?? [];
  if (fees.length > 1) {
    const rowH = 54;
    const boxH = 28 + fees.length * rowH + 20 + 70 + 18;
    sticker(ctx, PAD, y, W - PAD * 2 - 10, boxH, C.white, { r: 28, shadow: 8 }, () => {
      const bw = W - PAD * 2 - 10;
      let ry = 28;
      for (const r of fees) {
        ctx.fillStyle = C.ink;
        ctx.font = f(600, 32);
        ctx.fillText(fitText(ctx, r.label, bw - 340), 32, ry + 38);
        ctx.font = f(800, 34);
        const aw = ctx.measureText(r.amount).width;
        ctx.fillText(r.amount, bw - 32 - aw, ry + 38);
        ry += rowH;
      }
      ry += 4;
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(32, ry);
      ctx.lineTo(bw - 32, ry);
      ctx.stroke();
      ctx.restore();
      ry += 16;
      ctx.fillStyle = C.ink;
      ctx.font = f(800, 36);
      ctx.fillText("Total to move in", 32, ry + 46);
      ctx.font = f(800, 40);
      const tw = ctx.measureText(d.total ?? "").width + 36;
      ctx.fillStyle = C.yellow;
      roundRect(ctx, bw - 32 - tw, ry, tw, 64, 16);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      roundRect(ctx, bw - 32 - tw, ry, tw, 64, 16);
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.fillText(d.total ?? "", bw - 32 - tw + 18, ry + 46);
    });
    y += boxH + 36;
  }
  if (d.feesNote) {
    ctx.fillStyle = C.muted;
    ctx.font = f(500, 30);
    const lines = wrapLines(ctx, `Also: ${d.feesNote}`, W - PAD * 2, 2);
    for (const line of lines) {
      ctx.fillText(line, PAD, y + 30);
      y += 40;
    }
    y += 12;
  }

  // Footer bar
  y += 20;
  const footH = 184;
  const H = Math.min(MAX_H, Math.max(MIN_H, y + footH));
  const fy = H - footH;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, fy, W, footH);
  ctx.fillStyle = C.white;
  ctx.font = f(800, 42);
  ctx.fillText(fitText(ctx, d.shortLink, W - PAD * 2 - 240), PAD, fy + 76);
  if (d.code) {
    ctx.fillStyle = C.yellow;
    ctx.font = f(800, 34);
    const cw = ctx.measureText(`Listing #${d.code}`).width;
    ctx.fillText(`Listing #${d.code}`, W - PAD - cw, fy + 76);
  }
  ctx.fillStyle = C.onDarkMuted;
  ctx.font = f(500, 30);
  ctx.fillText("Never pay before you inspect.", PAD, fy + 128);

  // Crop to the real height
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported");
  octx.drawImage(canvas, 0, 0);

  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not make image"))), "image/jpeg", 0.88),
  );
}
