// Re-records a room video smaller in the browser (no extra libraries):
// plays it silently onto a canvas at max 640px and records that at a
// lower bitrate. Takes about as long as the video. Sound is dropped.
// Skipped for files that are already light (most WhatsApp videos).
// Falls back to the original file if recording isn't supported or
// doesn't make it smaller.

const MAX_SIDE = 640;
const BITRATE = 700_000; // ~5MB per minute
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const TYPES = [
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export type VideoResult = { blob: Blob; contentType: string; extension: "mp4" | "webm" | "mov"; compressed: boolean };

function original(file: File): VideoResult {
  const type = file.type || "video/mp4";
  const extension = type.includes("quicktime") ? "mov" : type.includes("webm") ? "webm" : "mp4";
  return { blob: file, contentType: type, extension, compressed: false };
}

// WhatsApp already squeezes videos hard. Re-recording one takes as long as
// the video plays and saves little, so light files go up as they are.
const LIGHT_BYTES = 8 * 1024 * 1024;
const LIGHT_BITRATE = 1_600_000;

export function isAlreadyLight(file: File, seconds: number | null): boolean {
  if (file.size <= LIGHT_BYTES) return true;
  return !!seconds && (file.size * 8) / seconds <= LIGHT_BITRATE;
}

export async function compressVideo(
  file: File,
  onProgress?: (fraction: number) => void,
  seconds: number | null = null,
): Promise<VideoResult> {
  if (isAlreadyLight(file, seconds)) return original(file);
  const canRecord =
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function";
  const mimeType = canRecord ? TYPES.find((t) => MediaRecorder.isTypeSupported(t)) : undefined;
  if (!mimeType) return original(file);

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video"));
      video.load();
    });

    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    // Even sizes keep video encoders happy.
    canvas.width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    canvas.height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);
    const ctx = canvas.getContext("2d");
    if (!ctx) return original(file);

    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATE });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    let running = true;
    const draw = () => {
      if (!running) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (video.duration) onProgress?.(Math.min(1, video.currentTime / video.duration));
      requestAnimationFrame(draw);
    };

    recorder.start(1000);
    await video.play();
    draw();
    await new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new Error("Video stopped playing"));
    });
    running = false;
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
    if (blob.size === 0 || blob.size >= file.size * 0.9) return original(file);
    onProgress?.(1);
    const contentType = mimeType.split(";")[0];
    return { blob, contentType, extension: contentType === "video/webm" ? "webm" : "mp4", compressed: true };
  } catch {
    return original(file);
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
