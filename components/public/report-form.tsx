"use client";

import { useState } from "react";
import { FUT_HOMES_WHATSAPP, whatsappLink } from "@/lib/contact";

const REASONS = [
  "Asked me to pay before inspecting",
  "Room doesn't match the video",
  "Room was already taken",
  "Agent wasn't the person on the listing",
  "Something else",
];

// No database: the report opens a WhatsApp chat to FUT Homes with
// everything already typed in. The student just presses send.
export default function ReportForm({ listing, agent, reason: initialReason }: { listing: string; agent: string; reason?: string }) {
  const [reason, setReason] = useState(initialReason === "taken" ? REASONS[2] : REASONS[0]);
  const [ref, setRef] = useState(listing);
  const [details, setDetails] = useState("");

  const message = [
    "Report for FUT Homes",
    `What went wrong: ${reason}`,
    ref ? `Listing: ${ref}` : null,
    agent ? `Agent: ${agent}` : null,
    details.trim() ? `What happened: ${details.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = whatsappLink(FUT_HOMES_WHATSAPP, message);
      }}
      className="flex flex-col gap-5"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">What went wrong?</legend>
        {REASONS.map((r) => (
          <label
            key={r}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-control-border bg-white px-3 has-[:checked]:border-[1.5px] has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50"
          >
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="h-4 w-4 accent-brand-700"
            />
            <span>{r}</span>
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Listing link or number
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. #9F1C2A"
          className="h-12 rounded-md border border-control-border bg-white px-3 text-base font-normal"
        />
        <span className="text-xs font-normal text-muted">Filled in for you when you report from a listing.</span>
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        What happened?
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="rounded-md border border-control-border bg-white px-3 py-2 text-base font-normal"
        />
      </label>

      <button
        type="submit"
        className="flex h-[52px] items-center justify-center gap-2 rounded-md bg-whatsapp font-semibold text-white active:bg-whatsapp-pressed"
      >
        Send report on WhatsApp
      </button>
      <p className="text-sm text-muted">
        This opens WhatsApp with your report typed in. Just press send. Agents with upheld reports lose their badge.
      </p>
    </form>
  );
}
