"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { photoUrl } from "@/lib/options";

type Props = {
  name: string; // form field that receives the uploaded paths (JSON array)
  folder: "agents" | "listings";
  max: number;
  label: string;
  hint?: string;
  onBusyChange?: (busy: boolean) => void;
};

// Photos are shrunk in the browser and uploaded straight to Supabase
// Storage as soon as they're picked. The form then only sends the paths.
export default function PhotoUpload({ name, folder, max, label, hint, onBusyChange }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusyBoth(value: boolean) {
    setBusy(value);
    onBusyChange?.(value);
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []).slice(0, max - paths.length);
    input.value = "";
    if (files.length === 0) return;

    setError(null);
    setBusyBoth(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    let failed = 0;

    for (const file of files) {
      try {
        const blob = await compressImage(file);
        const path = `${folder}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        uploaded.push(path);
      } catch {
        failed += 1;
      }
    }

    setPaths((current) => [...current, ...uploaded]);
    if (failed > 0) {
      setError(
        `${failed} photo${failed > 1 ? "s" : ""} didn't upload. Check your connection, or use a JPG/PNG instead of HEIC.`,
      );
    }
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
          {busy ? "Uploading…" : paths.length ? "Add more photos" : "Choose photo" + (max > 1 ? "s" : "")}
          <input
            type="file"
            accept="image/*"
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
