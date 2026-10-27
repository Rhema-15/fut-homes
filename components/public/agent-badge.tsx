"use client";

import { useId, useRef } from "react";
import { type AgentChecks, BADGE_LABEL, badgeLevel, checkLines } from "@/lib/agent-checks";
import { Icon } from "./icons";

type Props = {
  checks: AgentChecks;
  listingCode?: string;
};

// The badge is a button: tapping it shows exactly what was checked.
// It never claims more than Rhema ticked in admin, and with nothing
// ticked there's no badge at all.
export default function AgentBadge({ checks, listingCode }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const level = badgeLevel(checks);
  if (!level) return null;

  const trusted = level === "trusted";
  const lines = checkLines(checks);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dialog.current?.showModal();
        }}
        className={
          "inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-1 text-xs leading-4 font-semibold whitespace-nowrap " +
          (trusted ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700")
        }
        aria-haspopup="dialog"
      >
        <Icon name="shield-check" size={14} strokeWidth={2.4} />
        {BADGE_LABEL[level]}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(e) => {
          // Tap on the dark backdrop closes the sheet.
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85vh] w-full max-w-none rounded-t-lg bg-white p-0 text-ink backdrop:bg-overlay sm:mx-auto sm:max-w-md"
      >
        <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
          <span aria-hidden="true" className="h-1 w-10 self-center rounded-full bg-line" />
          <h2 id={titleId} className="text-lg leading-6 font-semibold">
            Verified home
          </h2>
          <p className="text-sm text-muted">Here&apos;s exactly what FUT Homes has checked:</p>
          <ul className="flex flex-col gap-3">
            {lines.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-success-50 text-success">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-md bg-warning-50 p-3 text-sm text-ink">
            <strong className="font-semibold text-warning">Still, never pay before you inspect.</strong> A badge shows the listing
            agent&apos;s track record, not that a deal is safe.
          </p>
          <div className="flex flex-col gap-1">
            <form method="dialog">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900"
              >
                Got it
              </button>
            </form>
            <a
              href={`/report${listingCode ? `?listing=${encodeURIComponent("#" + listingCode)}` : ""}`}
              className="flex h-11 items-center justify-center text-sm font-semibold text-error"
            >
              Report this listing
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
