// Shrinks photos (and stills pulled from videos) before upload:
// max 1000px on the long side, WebP where the browser supports it,
// JPEG otherwise. Brand spec: aim under ~80KB so cards load fast on
// slow data.

const MAX_SIDE = 1000;
const QUALITY = 0.72;

// Stills pulled from videos are auto-enhanced (brightness, contrast, a touch
// of colour and sharpness) and the sharpest frames are picked.
// Set to false to switch all of that off.
const ENHANCE_STILLS = true;

export type ImageResult = { blob: Blob; contentType: "image/webp" | "image/jpeg"; extension: "webp" | "jpg" };

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

// Quick look at a frame: how sharp it is and how bright it is.
function frameQuality(source: CanvasImageSource, width: number, height: number): { sharp: number; luma: number } {
  const w = 160;
  const h = Math.max(3, Math.round((height / width) * w));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { sharp: 0, luma: 128 };
  ctx.drawImage(source, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    g[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    sum += g[p];
  }
  // Sharpness: how much each pixel differs from its neighbours (blur scores low).
  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      lapSum += lap;
      lapSq += lap * lap;
      n++;
    }
  }
  const mean = lapSum / n;
  return { sharp: lapSq / n - mean * mean, luma: sum / (w * h) };
}

// Sharp frames with decent lighting score higher.
function frameScore(q: { sharp: number; luma: number }): number {
  const exposure = q.luma < 50 ? q.luma / 50 : q.luma > 210 ? (255 - q.luma) / 45 : 1;
  return q.sharp * Math.max(0.1, exposure);
}

// Gentle fix-up: stretch the brightness range, lift dark rooms a little,
// add a touch of colour and sharpness. Never changes what the room looks like.
function autoEnhance(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const total = w * h;
  const hist = new Uint32Array(256);
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
    hist[l]++;
    sum += l;
  }
  let lo = 0;
  let hi = 255;
  let acc = 0;
  for (lo = 0; lo < 255; lo++) {
    acc += hist[lo];
    if (acc >= total * 0.01) break;
  }
  acc = 0;
  for (hi = 255; hi > 0; hi--) {
    acc += hist[hi];
    if (acc >= total * 0.01) break;
  }
  if (hi - lo < 40) return; // flat frame, leave it alone

  const stretchedMean = Math.min(0.95, Math.max(0.05, (sum / total - lo) / (hi - lo)));
  const gamma = Math.min(1, Math.max(0.72, Math.log(0.5) / Math.log(stretchedMean)));
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
    lut[v] = Math.round(255 * Math.pow(t, gamma));
  }
  const SAT = 1.12;
  for (let i = 0; i < d.length; i += 4) {
    const r = lut[d[i]];
    const g = lut[d[i + 1]];
    const b = lut[d[i + 2]];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    d[i] = l + (r - l) * SAT;
    d[i + 1] = l + (g - l) * SAT;
    d[i + 2] = l + (b - l) * SAT;
  }

  // Mild sharpen.
  const src = new Uint8ClampedArray(d);
  const a = 0.3;
  const row = w * 4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * row + x * 4;
      for (let c = 0; c < 3; c++) {
        const k = i + c;
        d[k] = src[k] * (1 + 4 * a) - a * (src[k - 4] + src[k + 4] + src[k - row] + src[k + row]);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

async function toCompressed(
  source: CanvasImageSource,
  width: number,
  height: number,
  enhance = false,
): Promise<ImageResult> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: enhance });
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (enhance) autoEnhance(ctx, canvas.width, canvas.height);

  // Browsers that can't make WebP quietly hand back a PNG instead.
  const webp = await encode(canvas, "image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, contentType: "image/webp", extension: "webp" };
  const jpeg = await encode(canvas, "image/jpeg");
  if (!jpeg) throw new Error("Could not process image");
  return { blob: jpeg, contentType: "image/jpeg", extension: "jpg" };
}

export async function compressImage(file: File): Promise<ImageResult> {
  const bitmap = await createImageBitmap(file);
  try {
    return await toCompressed(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

// Pulls `count` evenly spaced still shots from a video, skipping the
// first and last 10% (usually shaky or pointing at the floor).
// Also returns the video's length in seconds.
export async function videoStills(file: File, count: number): Promise<{ stills: ImageResult[]; seconds: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video"));
      video.load();
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || !video.videoWidth) {
      throw new Error("Could not read video");
    }

    function seek(time: number): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Could not read video"));
        video.currentTime = time;
      });
    }

    // Look at 3 candidate frames for every still we need, then keep the
    // sharpest, best-lit one from each third of the video. Evenly spread, so
    // the photos still cover the whole room.
    const PER = ENHANCE_STILLS ? 3 : 1;
    const total = count * PER;
    const times: number[] = [];
    for (let i = 0; i < total; i++) {
      const fraction = total === 1 ? 0.5 : 0.1 + (0.8 * i) / (total - 1);
      times.push(duration * fraction);
    }

    const chosen: number[] = [];
    for (let i = 0; i < count; i++) {
      const group = times.slice(i * PER, i * PER + PER);
      if (PER === 1 || group.length === 1) {
        chosen.push(group[0]);
        continue;
      }
      let best = group[0];
      let bestScore = -1;
      for (const time of group) {
        await seek(time);
        const score = frameScore(frameQuality(video, video.videoWidth, video.videoHeight));
        if (score > bestScore) {
          bestScore = score;
          best = time;
        }
      }
      chosen.push(best);
    }

    const stills: ImageResult[] = [];
    for (const time of chosen) {
      await seek(time);
      stills.push(await toCompressed(video, video.videoWidth, video.videoHeight, ENHANCE_STILLS));
    }
    return { stills, seconds: Math.round(duration) };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
