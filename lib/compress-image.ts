// Shrinks photos (and stills pulled from videos) before upload:
// max 1000px on the long side, WebP where the browser supports it,
// JPEG otherwise. Brand spec: aim under ~80KB so cards load fast on
// slow data.

const MAX_SIDE = 1000;
const QUALITY = 0.72;

export type ImageResult = { blob: Blob; contentType: "image/webp" | "image/jpeg"; extension: "webp" | "jpg" };

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

async function toCompressed(source: CanvasImageSource, width: number, height: number): Promise<ImageResult> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

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

    const stills: ImageResult[] = [];
    for (let i = 0; i < count; i++) {
      const fraction = count === 1 ? 0.5 : 0.1 + (0.8 * i) / (count - 1);
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Could not read video"));
        video.currentTime = duration * fraction;
      });
      stills.push(await toCompressed(video, video.videoWidth, video.videoHeight));
    }
    return { stills, seconds: Math.round(duration) };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
