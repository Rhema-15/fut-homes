"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type ImageResult, compressImage, videoStills } from "@/lib/compress-image";
import { MAX_VIDEO_BYTES, compressVideo } from "@/lib/compress-video";
import { photoUrl, videoUrl } from "@/lib/options";

const LOGIN_EXPIRED =
  "Your login has expired. Click Log out at the top, log back in, then add the photos again.";

function isLoginError(message: string) {
  return /jwt|token|unauthori[sz]ed|expired|signature/i.test(message);
}

type Props = {
  name: string; // form field that receives the uploaded photo paths (JSON array)
  folder: "agents" | "listings";
  max: number;
  label: string;
  hint?: string;
  // Listings only: a picked video gives still shots for photos AND is
  // shrunk and attached as the listing's video (form field "video").
  allowVideo?: boolean;
  onBusyChange?: (busy: boolean) => void;
  // When editing: what's already saved.
  initialPaths?: string[];
  initialVideo?: string | null;
  initialVideoSeconds?: number | null;
};

// Photos are shrunk in the browser and uploaded straight to Supabase
// Storage as soon as they're picked. The form then only sends the paths.
export default function PhotoUpload({
  name,
  folder,
  max,
  label,
  hint,
  allowVideo = false,
  onBusyChange,
  initialPaths = [],
  initialVideo = null,
  initialVideoSeconds = null,
}: Props) {
  const [paths, setPaths] = useState<string[]>(initialPaths);
  const [video, setVideo] = useState<string | null>(initialVideo);
  const [videoSeconds, setVideoSeconds] = useState<number | null>(initialVideoSeconds);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  function setBusyStatus(value: string | null) {
    setStatus(value);
    onBusyChange?.(value !== null);
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;

    setError(null);
    setBusyStatus("Uploading…");
    const supabase = createClient();

    // Make sure the login is still fresh before uploading. An old login
    // (tab left open for hours) is what causes "JWT failed verification".
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError(LOGIN_EXPIRED);
      setBusyStatus(null);
      return;
    }

    let room = max - paths.length;
    const problems: string[] = [];
    let failed = 0;
    let videoDone = false;
    let loginExpired = false;

    async function uploadPhoto(image: ImageResult) {
      const path = `${folder}/${crypto.randomUUID()}.${image.extension}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, image.blob, { contentType: image.contentType, cacheControl: "31536000" });
      if (uploadError) {
        if (isLoginError(uploadError.message)) loginExpired = true;
        throw uploadError;
      }
      // Show each photo as soon as it's up, so slow uploads still feel alive.
      setPaths((current) => [...current, path]);
    }

    async function handleVideo(file: File) {
      // 1. Still shots for the photos.
      if (room > 0) {
        setBusyStatus("Pulling photos from video…");
        try {
          const { stills, seconds } = await videoStills(file, Math.min(6, room));
          setVideoSeconds(seconds);
          for (const still of stills) {
            try {
              await uploadPhoto(still);
              room -= 1;
            } catch {
              failed += 1;
            }
          }
        } catch {
          problems.push("Couldn't read that video on this device. Try the MP4 from WhatsApp.");
          return;
        }
      }

      if (room <= 0) {
        try {
          const { seconds } = await videoStills(file, 0);
          setVideoSeconds(seconds);
        } catch {
          /* length is optional */
        }
      }

      // 2. The video itself (one per listing; a new one replaces the old).
      if (videoDone) return;
      videoDone = true;
      setBusyStatus("Shrinking video… keep this tab open");
      const result = await compressVideo(file, (f) =>
        setBusyStatus(`Shrinking video… ${Math.round(f * 100)}% (keep this tab open)`),
      );
      if (result.blob.size > MAX_VIDEO_BYTES) {
        problems.push("The video is too big (over 25MB). Photos were added; send a shorter video.");
        return;
      }
      setBusyStatus("Uploading video…");
      const path = `listings/${crypto.randomUUID()}.${result.extension}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, result.blob, { contentType: result.contentType, cacheControl: "31536000" });
      if (uploadError) {
        if (isLoginError(uploadError.message)) loginExpired = true;
        else problems.push(`The video didn't upload (${uploadError.message}). Photos were still added.`);
        return;
      }
      setVideo(path);
    }

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        if (allowVideo) await handleVideo(file);
        continue;
      }
      if (room <= 0) continue;
      try {
        await uploadPhoto(await compressImage(file));
        room -= 1;
      } catch {
        failed += 1;
      }
    }

    if (loginExpired) {
      problems.unshift(LOGIN_EXPIRED);
    } else if (failed > 0) {
      problems.unshift(
        `${failed} photo${failed > 1 ? "s" : ""} didn't upload. Check your connection, or use a JPG/PNG instead of HEIC.`,
      );
    }
    setError(problems.length ? problems.join(" ") : null);
    setBusyStatus(null);
  }

  function remove(path: string) {
    setPaths((current) => current.filter((p) => p !== path));
  }

  function makeCover(path: string) {
    setPaths((current) => [path, ...current.filter((p) => p !== path)]);
  }

  const full = paths.length >= max;
  const pickLabel = paths.length
    ? allowVideo
      ? "Add more photos or a video"
      : "Add more photos"
    : allowVideo
      ? "Choose photos or a video"
      : "Choose photo" + (max > 1 ? "s" : "");

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span>{label}</span>
      {hint && <span className="text-neutral-500">{hint}</span>}

      {paths.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {paths.map((path, i) => (
            <li key={path} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(path)}
                alt={`Photo ${i + 1}`}
                className="aspect-square w-full rounded-md object-cover"
              />
              {i === 0 && max > 1 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                  Cover
                </span>
              )}
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(path)}
                  className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-xs"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(path)}
                className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {video && (
        <div className="flex flex-col gap-1">
          <span className="text-neutral-500">Room video</span>
          <video src={videoUrl(video)} controls preload="metadata" className="w-full rounded-md bg-black" />
          <button type="button" onClick={() => { setVideo(null); setVideoSeconds(null); }} className="self-start text-xs underline">
            Remove video
          </button>
        </div>
      )}

      {(!full || allowVideo) && (
        <label className="cursor-pointer rounded-md border border-dashed border-neutral-400 px-3 py-4 text-center text-neutral-600">
          {status ?? (full ? "Photos full. Add a video" : pickLabel)}
          <input
            type="file"
            accept={allowVideo ? (full ? "video/*" : "image/*,video/*") : "image/*"}
            multiple={max > 1}
            disabled={busy}
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <input type="hidden" name={name} value={JSON.stringify(paths)} />
      {allowVideo && <input type="hidden" name="video" value={video ?? ""} />}
      {allowVideo && <input type="hidden" name="video_seconds" value={video && videoSeconds ? String(videoSeconds) : ""} />}
    </div>
  );
}
