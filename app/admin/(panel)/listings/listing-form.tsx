"use client";

import { useActionState, useState } from "react";
import PhotoUpload from "@/components/photo-upload";
import { CAMPUSES, ROOM_TYPES } from "@/lib/options";
import { AMENITIES } from "@/lib/amenities";
import type { FormState } from "@/lib/form-utils";

export type ListingDefaults = {
  agent_id: string;
  title: string;
  room_type: string;
  campus: string;
  area: string | null;
  distance_km: number | null;
  price: number;
  fees_note: string | null;
  agent_fee: number | null;
  caution_fee: number | null;
  amenities: string[];
  description: string | null;
  video_path: string | null;
  video_seconds: number | null;
  photos: string[];
};

const initialState: FormState = { error: null };
const input = "rounded-md border border-neutral-300 px-3 py-2 text-base";

export default function ListingForm({
  agents,
  action,
  listing,
  submitLabel = "Save listing",
  areas = [],
}: {
  agents: { id: string; name: string }[];
  areas?: string[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  listing?: ListingDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Agent
        <select name="agent_id" required defaultValue={listing?.agent_id ?? ""} className={input}>
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
        <input name="title" required defaultValue={listing?.title} placeholder="Self-contain with running water" className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Room type
          <select name="room_type" required defaultValue={listing?.room_type ?? ""} className={input}>
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
          <select name="campus" required defaultValue={listing?.campus ?? ""} className={input}>
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
          Area (pick a known one)
          <input name="area" list="known-areas" autoComplete="off" defaultValue={listing?.area ?? ""} placeholder="Tunga Goro" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Distance to campus (km)
          <input name="distance_km" defaultValue={listing?.distance_km ?? ""} inputMode="decimal" placeholder="1.2" className={input} />
        </label>
      </div>

      <datalist id="known-areas">
        {areas.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      <label className="flex flex-col gap-1 text-sm">
        Rent per year (₦)
        <input name="price" defaultValue={listing?.price ?? ""} inputMode="numeric" required placeholder="150,000" className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Agent fee (₦, optional)
          <input name="agent_fee" defaultValue={listing?.agent_fee ?? ""} inputMode="numeric" placeholder="20,000" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Caution fee (₦, optional)
          <input name="caution_fee" defaultValue={listing?.caution_fee ?? ""} inputMode="numeric" placeholder="10,000" className={input} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Other fees note (optional)
        <input name="fees_note" defaultValue={listing?.fees_note ?? ""} placeholder="Legal fee ₦10,000, NEPA bill shared" className={input} />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1">What&apos;s included (tick what the agent said)</legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {Object.entries(AMENITIES).map(([value, label]) => (
            <label key={value} className="flex min-h-9 items-center gap-2">
              <input
                type="checkbox"
                name="amenities"
                value={value}
                defaultChecked={listing?.amenities.includes(value)}
                className="size-4"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          defaultValue={listing?.description ?? ""}
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
        hint="Add the photo of the building first: it becomes the cover. Then the agent's video: it gives 6 still shots (remove blurry ones) and is attached for students to watch. Use Make cover to change the cover."
        allowVideo
        onBusyChange={setUploading}
        initialPaths={listing?.photos}
        initialVideo={listing?.video_path}
        initialVideoSeconds={listing?.video_seconds}
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
        {uploading ? "Waiting for uploads…" : pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
