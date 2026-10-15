"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PhotoUpload from "@/components/photo-upload";
import { CAMPUSES, ROOM_TYPES } from "@/lib/options";
import { AMENITIES } from "@/lib/amenities";
import type { FormState } from "@/lib/form-utils";
import { parsePost } from "@/lib/parse-post";

const LAST_KEY = "futhomes:last-listing";

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
  quickAdd = false,
}: {
  quickAdd?: boolean;
  agents: { id: string; name: string }[];
  areas?: string[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  listing?: ListingDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [uploading, setUploading] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [post, setPost] = useState("");
  const [filled, setFilled] = useState<{ got: string[]; check: string[] } | null>(null);
  const [draft, setDraft] = useState(false);

  // New listings start with the agent and campus used last time.
  useEffect(() => {
    if (!quickAdd) return;
    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) ?? "{}");
      const f = form.current;
      if (!f) return;
      const agent = f.elements.namedItem("agent_id") as HTMLSelectElement | null;
      const campus = f.elements.namedItem("campus") as HTMLSelectElement | null;
      if (agent && last.agent_id && agents.some((a) => a.id === last.agent_id)) agent.value = last.agent_id;
      if (campus && last.campus) campus.value = last.campus;
    } catch {
      /* no saved choice */
    }
  }, [quickAdd, agents]);

  function remember() {
    if (!quickAdd || !form.current) return;
    const f = form.current;
    try {
      localStorage.setItem(
        LAST_KEY,
        JSON.stringify({
          agent_id: (f.elements.namedItem("agent_id") as HTMLSelectElement).value,
          campus: (f.elements.namedItem("campus") as HTMLSelectElement).value,
        }),
      );
    } catch {
      /* storage blocked: nothing to remember */
    }
  }

  function fillFromPost() {
    const f = form.current;
    if (!f || !post.trim()) return;
    const p = parsePost(post, { knownAreas: areas, agents });
    const set = (name: string, value: string | number | undefined) => {
      const el = f.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (el && value !== undefined && value !== "") el.value = String(value);
    };
    const got: string[] = [];
    const check: string[] = [];
    set("title", p.title);
    if (p.agentId) {
      set("agent_id", p.agentId);
      got.push("agent");
    }
    if (p.roomType) {
      set("room_type", p.roomType);
      got.push("room type");
    } else check.push("Room type isn't clear in the post. Pick it.");
    if (p.campus) {
      set("campus", p.campus);
      got.push("campus");
    } else check.push("Campus isn't in the post. Check it's right.");
    if (p.area) {
      set("area", p.area);
      got.push("area");
    } else {
      set("area", "");
      (f.elements.namedItem("area") as HTMLInputElement).value = "";
      check.push("No area found. Add it if you know it.");
    }
    if (p.price) {
      set("price", p.price.toLocaleString("en-NG"));
      got.push("price");
      setDraft(false);
    } else {
      (f.elements.namedItem("price") as HTMLInputElement).value = "";
      setDraft(true);
      check.push("No price in the post (\"DM for price\"). It will save as a hidden draft; ask the agent and add the price later.");
    }
    (f.elements.namedItem("agent_fee") as HTMLInputElement).value = p.agentFee ? p.agentFee.toLocaleString("en-NG") : "";
    (f.elements.namedItem("caution_fee") as HTMLInputElement).value = p.cautionFee ? p.cautionFee.toLocaleString("en-NG") : "";
    (f.elements.namedItem("fees_note") as HTMLInputElement).value = p.feesNote ?? "";
    if (p.agentFee || p.cautionFee || p.feesNote) got.push("fees");
    f.querySelectorAll<HTMLInputElement>('input[name="amenities"]').forEach((box) => {
      box.checked = p.amenities.includes(box.value as never);
    });
    if (p.amenities.length) got.push(`${p.amenities.length} ticks`);
    (f.elements.namedItem("description") as HTMLTextAreaElement).value = p.description ?? "";
    if (/total package/i.test(p.feesNote ?? "")) check.push("\"Total package\": rent already includes fees, so leave agent and caution fee empty.");
    setFilled({ got, check });
  }

  return (
    <form ref={form} action={formAction} onSubmit={remember} className="mt-6 flex flex-col gap-4">
      {quickAdd && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-300 bg-neutral-50 p-3">
          <label htmlFor="agent-post" className="text-sm font-medium">
            Paste the agent&apos;s post
          </label>
          <textarea
            id="agent-post"
            value={post}
            onChange={(e) => setPost(e.target.value)}
            rows={5}
            placeholder={"Copy the agent's WhatsApp message and paste it here.\nCLASSY Selfcon at Talba road 500k ✅POP ✅Wardrobe…"}
            className={input}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillFromPost}
              disabled={!post.trim()}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Fill the form
            </button>
            {post && (
              <button
                type="button"
                onClick={() => {
                  setPost("");
                  setFilled(null);
                }}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                Clear
              </button>
            )}
          </div>
          {filled && (
            <div role="status" className="text-sm">
              {filled.got.length > 0 && <p className="text-green-700">Filled: {filled.got.join(", ")}. Check them below.</p>}
              {filled.check.map((c) => (
                <p key={c} className="text-amber-700">
                  ⚠ {c}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

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
        <input
          name="price"
          defaultValue={listing?.price ? listing.price : ""}
          inputMode="numeric"
          required={!draft}
          placeholder={draft ? "Not known yet" : "150,000"}
          className={input}
        />
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

      {quickAdd && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="draft" checked={draft} onChange={(e) => setDraft(e.target.checked)} className="mt-0.5 size-4" />
          <span>
            Save as hidden draft (no price or photos yet). Students won&apos;t see it until you add them and tap Show.
          </span>
        </label>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {quickAdd ? (
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            name="after"
            value="new"
            disabled={pending || uploading}
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {uploading ? "Waiting for uploads…" : pending ? "Saving…" : "Save & add another"}
          </button>
          <button
            type="submit"
            name="after"
            value="list"
            disabled={pending || uploading}
            className="rounded-md border border-neutral-300 px-4 py-2 font-medium disabled:opacity-60"
          >
            Save & see all listings
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {uploading ? "Waiting for uploads…" : pending ? "Saving…" : submitLabel}
        </button>
      )}
    </form>
  );
}
