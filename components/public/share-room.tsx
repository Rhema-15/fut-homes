"use client";

import { useEffect, useRef, useState } from "react";
import { type ShareCardData, makeShareCard } from "@/lib/share-card";
import { Icon } from "./icons";

type Props = {
  card: ShareCardData;
  caption: string;
  fileName: string;
  // "icon": round button over the gallery. "button": full-width (admin).
  variant?: "icon" | "button";
};

// Share a room as a branded image + caption with the link. On phones
// that can share files (most Android), it goes straight to WhatsApp.
// Otherwise: save the image and copy the caption.
export default function ShareRoom({ card, caption, fileName, variant = "icon" }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function open() {
    dialog.current?.showModal();
    if (blob) return;
    try {
      const b = await makeShareCard(card);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
    } catch {
      setFailed(true);
    }
  }

  async function shareImage() {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/jpeg" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    saveImage();
    await copyCaption("Image saved. Caption copied: paste it with the image.");
  }

  function saveImage() {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = fileName;
    a.click();
  }

  async function copyCaption(message = "Caption copied") {
    try {
      await navigator.clipboard.writeText(caption);
      setStatus(message);
    } catch {
      setStatus("Couldn't copy. Long-press the caption to copy it.");
    }
    setTimeout(() => setStatus(null), 3000);
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={open}
          aria-label="Share this room"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-float"
        >
          <Icon name="share" size={20} />
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 text-sm font-medium"
        >
          <Icon name="share" size={18} />
          Share kit: image + caption
        </button>
      )}

      <dialog
        ref={dialog}
        aria-label="Share this room"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92vh] w-full max-w-none overflow-y-auto rounded-t-lg bg-white p-0 font-sans text-ink backdrop:bg-overlay sm:mx-auto sm:max-w-md"
      >
        <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
          <span aria-hidden="true" className="h-1 w-10 self-center rounded-full bg-line" />
          <h2 className="text-lg leading-6 font-semibold">Share this room</h2>

          <div className="overflow-hidden rounded-md bg-brand-50" style={{ aspectRatio: "1080 / 1350", maxHeight: "48vh", margin: "0 auto" }}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Share image for this room" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-muted">
                {failed ? "Couldn't make the image on this phone. You can still share the caption." : "Making image…"}
              </div>
            )}
          </div>

          <p className="rounded-md bg-bg p-3 text-sm whitespace-pre-line text-slate select-all">{caption}</p>

          {status && (
            <p role="status" className="text-sm font-semibold text-success">
              {status}
            </p>
          )}

          <button
            type="button"
            onClick={shareImage}
            disabled={!blob}
            className="flex h-[52px] items-center justify-center gap-2 rounded-md bg-whatsapp font-semibold text-white active:bg-whatsapp-pressed disabled:bg-line disabled:text-muted"
          >
            <Icon name="share" size={20} />
            Share image + caption
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={saveImage}
              disabled={!preview}
              className="flex h-12 items-center justify-center rounded-md bg-white font-semibold text-brand-700 shadow-[inset_0_0_0_1.5px_var(--color-brand-700)] disabled:opacity-50"
            >
              Save image
            </button>
            <button
              type="button"
              onClick={() => copyCaption()}
              className="flex h-12 items-center justify-center rounded-md bg-white font-semibold text-brand-700 shadow-[inset_0_0_0_1.5px_var(--color-brand-700)]"
            >
              Copy caption
            </button>
          </div>
          <form method="dialog">
            <button type="submit" className="flex h-11 w-full items-center justify-center text-sm font-semibold text-muted">
              Close
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
