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
  shareButton?: React.ReactNode;
};

// Swipeable stills (CSS scroll-snap, no library). On a computer (mouse,
// no swiping) arrow buttons and the keyboard's arrow keys move between
// photos. The video only downloads when the student taps "Watch room video".
export default function Gallery({ photos, title, taken, videoPath, videoLabel, backHref, shareButton }: Props) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(false);

  function goTo(i: number) {
    const el = strip.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative bg-brand-50">
      <div
        ref={strip}
        tabIndex={photos.length > 1 ? 0 : undefined}
        aria-label={photos.length > 1 ? "Photos. Use the arrow keys to see more." : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            goTo(index + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            goTo(index - 1);
          }
        }}
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

      {photos.length > 1 && index > 0 && (
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous photo"
          className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-float [@media(pointer:fine)]:flex"
        >
          <Icon name="chevron-left" size={22} />
        </button>
      )}
      {photos.length > 1 && index < photos.length - 1 && (
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next photo"
          className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-float [@media(pointer:fine)]:flex"
        >
          <Icon name="chevron-right" size={22} />
        </button>
      )}

      <a
        href={backHref}
        aria-label="Back to rooms"
        className="absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-float"
      >
        <Icon name="arrow-left" size={22} />
      </a>
      {shareButton && <div className="absolute top-3 right-3">{shareButton}</div>}

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
