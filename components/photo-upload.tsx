"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, videoStills } from "@/lib/compress-image";
import { photoUrl } from "@/lib/options";

type Props = {
  name: string; // form field that receives the uploaded paths (JSON array)
  folder: "agents" | "listings";
  max: number;
  label: string;
  hint?: string;
  allowVideo?: boolean; // pull still shots out of videos
  onBusyChange?: (busy: boolean) => void;
};

// Photos are shrunk in the browser and uploaded straight to Supabase
// Storage as soon as they're picked. The form then only sends the paths.
export default function PhotoUpload({ name, folder, max, label, hint, allowVideo = false, onBusyChange }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusyBoth(value: boolean) {
    setBusy(value);
    onBusyChange?.(value);
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;

    setError(null);
    setBusyBoth(true);
    const supabase = createClient();
    let room = max - paths.length;
    let failed = 0;
    let badVideos = 0;

    async function upload(blob: Blob) {
      const path = `${folder}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (uploadError) throw uploadError;
      // Show each photo as soon as it's up, so slow uploads still feel alive.
      setPaths((current) => [...current, path]);
    }

    for (const file of files) {
      if (room <= 0) break;
      try {
        if (file.type.startsWith("video/")) {
          if (!allowVideo) continue;
          let stills: Blob[];
          try {
            stills = await videoStills(file, Math.min(6, room));
          } catch {
            badVideos += 1;
            continue;
          }
          for (const still of stills) {
            try {
              await upload(still);
              room -= 1;
            } catch {
              failed += 1;
            }
          }
        } else {
          await upload(await compressImage(file));
          room -= 1;
        }
      } catch {
        failed += 1;
      }
    }

    const problems: string[] = [];
    if (failed > 0) {
      problems.push(
        `${failed} photo${failed > 1 ? "s" : ""} didn't upload. Check your connection, or use a JPG/PNG instead of HEIC.`,
      );
    }
    if (badVideos > 0) {
      problems.push("A video couldn't be read on this device. Try the MP4 from WhatsApp, or take screenshots instead.");
    }
    setError(problems.length ? problems.join(" ") : null);
    setBusyBoth(false);
  }

  function remove(path: string) {
    setPaths((current) => current.filter((p) => p !== path));
  }

  const full = paths.length >= max;

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

      {!full && (
        <label className="cursor-pointer rounded-md border border-dashed border-neutral-400 px-3 py-4 text-center text-neutral-600">
          {busy
            ? "Uploading…"
            : paths.length
              ? allowVideo
                ? "Add more photos or a video"
                : "Add more photos"
              : allowVideo
                ? "Choose photos or a video"
                : "Choose photo" + (max > 1 ? "s" : "")}
          <input
            type="file"
            accept={allowVideo ? "image/*,video/*" : "image/*"}
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
    </div>
  );
}
