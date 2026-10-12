"use client";

import { useRef, useState } from "react";
import { photoUrl, videoUrl } from "@/lib/options";
import { Icon } from "./icons";

type Props = {
  photos: string[];
  title: string;
  taken: boolean;
  videoPath: string | null;
  videoLabel: string | null; // e.g. "0:45"
  backHref: string;
};

// Swipeable stills (CSS scroll-snap, no library). The video only
// downloads when the student taps "Watch room video".
export default function Gallery({ photos, title, taken, videoPath, videoLabel, backHref }: Props) {
  const [index, setIndex] = useState(0);
  const [shared, setShared] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} · FUT Homes`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="relative bg-brand-50">
      <div
        ref={strip}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto min-[768px]:rounded-lg"
      >
        {photos.map((path, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={path}
            src={photoUrl(path)}
            alt={`${title}, photo ${i + 1} of ${photos.length}`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className={"h-full w-full flex-none snap-center object-cover " + (taken ? "opacity-40 grayscale" : "")}
          />
        ))}
      </div>

      <a
        href={backHref}
        aria-label="Back to rooms"
        className="absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-float"
      >
        <Icon name="arrow-left" size={22} />
      </a>
      <button
        type="button"
        onClick={share}
        aria-label="Share this room"
        className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-float"
      >
        <Icon name={shared ? "check" : "share"} size={20} />
      </button>
      {shared && (
        <span role="status" className="absolute top-16 right-3 rounded-full bg-scrim px-2 py-1 text-xs font-semibold text-white">
          Link copied
        </span>
      )}

      {videoPath && (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            player.current?.showModal();
          }}
          className="absolute bottom-3 left-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-scrim px-3.5 text-sm font-semibold text-white"
        >
          <Icon name="play" size={14} />
          Watch room video{videoLabel ? ` · ${videoLabel}` : ""}
        </button>
      )}
      {photos.length > 1 && (
        <span className="absolute right-3 bottom-3 rounded-full bg-scrim px-2 py-1 text-xs leading-4 font-semibold text-white">
          {Math.min(index + 1, photos.length)} / {photos.length}
        </span>
      )}

      {videoPath && (
        <dialog
          ref={player}
          aria-label="Room video"
          onClose={() => setPlaying(false)}
          onClick={(e) => {
            if (e.target === player.current) player.current?.close();
          }}
          className="m-auto w-full max-w-lg bg-transparent p-4 backdrop:bg-black/85"
        >
          <div className="flex flex-col gap-3">
            <form method="dialog" className="self-end">
              <button type="submit" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink">
                <Icon name="x" size={16} />
                Close
              </button>
            </form>
            {/* Only mounted after the tap, so nothing downloads before. */}
            {playing && (
              <video src={videoUrl(videoPath)} controls autoPlay playsInline className="max-h-[75vh] w-full rounded-lg bg-black" />
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
