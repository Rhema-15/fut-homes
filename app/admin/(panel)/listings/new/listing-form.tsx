"use client";

import { useActionState, useState } from "react";
import PhotoUpload from "@/components/photo-upload";
import { CAMPUSES, ROOM_TYPES } from "@/lib/options";
import type { FormState } from "@/lib/form-utils";
import { createListing } from "../actions";

const initialState: FormState = { error: null };
const input = "rounded-md border border-neutral-300 px-3 py-2 text-base";

export default function ListingForm({ agents }: { agents: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createListing, initialState);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Agent
        <select name="agent_id" required defaultValue="" className={input}>
          <option value="" disabled>
            Choose agent
          </option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input name="title" required placeholder="Self-contain with running water" className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Room type
          <select name="room_type" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose
            </option>
            {Object.entries(ROOM_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nearest campus
          <select name="campus" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose
            </option>
            {Object.entries(CAMPUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Area (optional)
          <input name="area" placeholder="Tunga Goro" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Walk to campus (mins)
          <input name="walk_minutes" type="number" inputMode="numeric" min={0} placeholder="10" className={input} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Rent per year (₦)
        <input name="price" inputMode="numeric" required placeholder="150,000" className={input} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Other fees (optional)
        <input name="fees_note" placeholder="Agency ₦20,000 · Caution ₦10,000" className={input} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          rows={4}
          placeholder="Water, light, security, fence, tiled floor…"
          className={input}
        />
      </label>

      <PhotoUpload
        name="photos"
        folder="listings"
        max={8}
        label="Photos (at least 1, up to 8)"
        hint="Pick photos, or the agent's video and we'll pull 6 still shots from it. Remove any blurry ones. The first photo is the cover."
        allowVideo
        onBusyChange={setUploading}
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {uploading ? "Waiting for photos…" : pending ? "Saving…" : "Save listing"}
      </button>
    </form>
  );
}
