// Shrinks photos (and stills pulled from videos) before upload:
// max 1600px on the long side, saved as JPEG. Keeps pages fast for
// students on slow data.

const MAX_SIDE = 1600;
const QUALITY = 0.75;

function toJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Could not process image"));
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      QUALITY,
    );
  });
}

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    return await toJpeg(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

// Pulls `count` evenly spaced still shots from a video, skipping the
// first and last 10% (usually shaky or pointing at the floor).
export async function videoStills(file: File, count: number): Promise<Blob[]> {
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

    const stills: Blob[] = [];
    for (let i = 0; i < count; i++) {
      const fraction = count === 1 ? 0.5 : 0.1 + (0.8 * i) / (count - 1);
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Could not read video"));
        video.currentTime = duration * fraction;
      });
      stills.push(await toJpeg(video, video.videoWidth, video.videoHeight));
    }
    return stills;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
