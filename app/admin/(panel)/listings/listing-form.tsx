"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PhotoUpload from "@/components/photo-upload";
import { CAMPUSES, ROOM_TYPES } from "@/lib/options";
import { AMENITIES } from "@/lib/amenities";
import type { FormState } from "@/lib/form-utils";
import { parsePost } from "@/lib/parse-post";
import { matchingShots, photoHash } from "@/lib/image-hash";
import { photoUrl } from "@/lib/options";

const HASH_KEY = "futhomes:photo-hashes";

// Hashes of already-listed photos are kept on this device, so each old
// photo is downloaded once, not every time a video is picked.
async function cachedHash(path: string, cache: Record<string, string>): Promise<bigint | null> {
  if (cache[path]) return BigInt(cache[path]);
  const h = await photoHash(photoUrl(path));
  if (h !== null) cache[path] = h.toString();
  return h;
}

type VideoMatch = { id: string; title: string; agent: string; shots: number; of: number };

const LAST_KEY = "futhomes:last-listing";
export const NEW_AGENT = "__new";

export type ExistingListing = {
  id: string;
  title: string;
  price: number;
  area: string | null;
  room_type: string;
  status: string;
  agent: string;
  photos: string[];
};

const sameArea = (a: string | null, b: string | undefined) => {
  if (!a || !b) return true; // one side unknown: still worth a look
  const norm = (x: string) => x.toLowerCase().replace(/\s+road$/, "").trim();
  return norm(a) === norm(b) || norm(a).includes(norm(b)) || norm(b).includes(norm(a));
};

export type ListingDefaults = {
  agent_id: string | null;
  title: string;
  room_type: string | null;
  campus: string | null;
  area: string | null;
  distance_km: number | null;
  price: number | null;
  fees_note: string | null;
  agent_fee: number | null;
  caution_fee: number | null;
  amenities: string[];
  description: string | null;
  video_path: string | null;
  video_seconds: number | null;
  photos: string[];
  admin_note?: string | null;
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
  existing = [],
  lastAgent,
}: {
  lastAgent?: string;
  existing?: ExistingListing[];
  quickAdd?: boolean;
  agents: { id: string; name: string; whatsapp?: string }[];
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
  const [dupes, setDupes] = useState<ExistingListing[]>([]);
  const [newAgent, setNewAgent] = useState(quickAdd && agents.length === 0);
  const [videoCheck, setVideoCheck] = useState<"checking" | VideoMatch[] | null>(null);

  async function checkVideo(stills: Blob[]) {
    if (!quickAdd || existing.length === 0) return;
    setVideoCheck("checking");
    let cache: Record<string, string> = {};
    try {
      cache = JSON.parse(localStorage.getItem(HASH_KEY) ?? "{}");
    } catch {
      /* start fresh */
    }
    const fresh: bigint[] = [];
    for (const blob of stills) {
      const url = URL.createObjectURL(blob);
      const h = await photoHash(url);
      URL.revokeObjectURL(url);
      if (h !== null) fresh.push(h);
    }
    const flagged = new Set(dupes.map((d) => d.id));
    const matches: VideoMatch[] = [];
    // Flagged rooms: every photo. Others: first 3 (keeps data use low).
    const ordered = [...existing].sort((a, b) => Number(flagged.has(b.id)) - Number(flagged.has(a.id)));
    for (const e of ordered) {
      const paths = flagged.has(e.id) ? e.photos : e.photos.slice(0, 3);
      const old = (await Promise.all(paths.map((p) => cachedHash(p, cache)))).filter((h): h is bigint => h !== null);
      const shots = matchingShots(fresh, old);
      if (fresh.length && shots >= Math.min(2, fresh.length)) {
        matches.push({ id: e.id, title: e.title, agent: e.agent, shots, of: fresh.length });
      }
    }
    try {
      localStorage.setItem(HASH_KEY, JSON.stringify(cache));
    } catch {
      /* storage full or blocked */
    }
    setVideoCheck(matches.sort((a, b) => b.shots - a.shots));
  }

  // New listings start with the agent and campus used last time.
  useEffect(() => {
    if (!quickAdd) return;
    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) ?? "{}");
      const f = form.current;
      if (!f) return;
      const agent = f.elements.namedItem("agent_id") as HTMLSelectElement | null;
      const campus = f.elements.namedItem("campus") as HTMLSelectElement | null;
      const pick = lastAgent ?? last.agent_id;
      if (agent && pick && agents.some((a) => a.id === pick)) agent.value = pick;
      if (campus && last.campus) campus.value = last.campus;
    } catch {
      /* no saved choice */
    }
  }, [quickAdd, agents, lastAgent]);

  function remember() {
    if (!quickAdd || !form.current) return;
    const f = form.current;
    // A brand-new agent has no id yet; the next form gets it from the link.
    if ((f.elements.namedItem("agent_id") as HTMLSelectElement).value === NEW_AGENT) return;
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
      setNewAgent(false);
      got.push("agent");
    } else if (p.phone) {
      // Number in the post that isn't one of your agents: start a new one.
      set("agent_id", NEW_AGENT);
      setNewAgent(true);
      requestAnimationFrame(() => {
        const wa = form.current?.elements.namedItem("new_agent_whatsapp") as HTMLInputElement | null;
        if (wa) wa.value = "0" + p.phone!.slice(3);
      });
      check.push("The number in the post isn't one of your agents, so New agent is open. Add their name.");
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

    // Same price + same type + same area = probably the same room reposted.
    setDupes(
      p.price
        ? existing.filter(
            (e) => e.price === p.price && (!p.roomType || e.room_type === p.roomType) && sameArea(e.area, p.area),
          )
        : [],
    );
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
                  setDupes([]);
                }}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                Clear
              </button>
            )}
          </div>
          {dupes.length > 0 && (
            <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">Already listed? Same price, type and area as:</p>
              <ul className="mt-1 list-disc pl-5">
                {dupes.map((d) => (
                  <li key={d.id}>
                    <a href={`/admin/listings/${d.id}`} target="_blank" rel="noreferrer" className="underline">
                      {d.title}
                    </a>{" "}
                    · ₦{d.price.toLocaleString("en-NG")}
                    {d.agent ? ` · ${d.agent}` : ""}
                    {d.status === "taken" ? " · marked taken" : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-1">
                If it&apos;s the same room, don&apos;t save. Tap Clear and paste the next post. If it was marked taken,
                open it and mark it available again instead.
              </p>
            </div>
          )}
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
        <select
          name="agent_id"
          defaultValue={listing?.agent_id ?? (newAgent ? NEW_AGENT : "")}
          onChange={(e) => setNewAgent(e.target.value === NEW_AGENT)}
          className={input}
        >
          <option value="" disabled>
            Choose agent
          </option>
          {quickAdd && <option value={NEW_AGENT}>+ New agent</option>}
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      {newAgent && (
        <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-300 p-3 text-sm">
          <legend className="px-1 font-medium">New agent</legend>
          <label className="flex flex-col gap-1">
            Name
            <input name="new_agent_name" required autoComplete="off" placeholder="Gracious Houses" className={input} />
          </label>
          <label className="flex flex-col gap-1">
            WhatsApp number
            <input name="new_agent_whatsapp" required inputMode="tel" placeholder="0803 123 4567" className={input} />
          </label>
          <p className="text-neutral-600">Tick only what you&apos;ve checked. Nothing ticked: no badge.</p>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="new_agent_long_time_poster" className="mt-0.5 size-4" />
            Has been posting rooms around FUT for a long time
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="new_agent_still_posting" className="mt-0.5 size-4" />
            Still actively posting rooms
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="new_agent_students_confirmed" className="mt-0.5 size-4" />
            Past students confirmed they rented through them
          </label>
          <p className="text-neutral-600">Add their photo later from the Agents page.</p>
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input name="title" defaultValue={listing?.title} placeholder="Self-contain with running water" className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Room type
          <select name="room_type" defaultValue={listing?.room_type ?? ""} className={input}>
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
          <select name="campus" defaultValue={listing?.campus ?? ""} className={input}>
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
          placeholder="150,000 (leave empty if not known yet)"
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
        onStills={quickAdd ? checkVideo : undefined}
        initialPaths={listing?.photos}
        initialVideo={listing?.video_path}
        initialVideoSeconds={listing?.video_seconds}
      />

      {videoCheck === "checking" && (
        <p role="status" className="text-sm text-neutral-600">
          Comparing this video with rooms you&apos;ve listed…
        </p>
      )}
      {Array.isArray(videoCheck) && videoCheck.length > 0 && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">Same video as a room you already listed:</p>
          <ul className="mt-1 list-disc pl-5">
            {videoCheck.map((m) => (
              <li key={m.id}>
                <a href={`/admin/listings/${m.id}`} target="_blank" rel="noreferrer" className="underline">
                  {m.title}
                </a>
                {m.agent ? ` · ${m.agent}` : ""} · {m.shots} of {m.of} shots match
              </li>
            ))}
          </ul>
          <p className="mt-1">Don&apos;t save. Open it to check, then tap Clear and paste the next post.</p>
        </div>
      )}
      {Array.isArray(videoCheck) && videoCheck.length === 0 && (
        <p role="status" className="text-sm text-green-700">
          ✓ Video doesn&apos;t match any room you&apos;ve listed.
          {dupes.length > 0 ? " The price match above is a different room, so it's fine to save." : ""}
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
        <p className="text-neutral-600">
          Don&apos;t know something yet? Leave it empty and save. The room stays hidden and the list shows what&apos;s missing.
        </p>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="draft" checked={draft} onChange={(e) => setDraft(e.target.checked)} className="mt-0.5 size-4" />
          <span>Keep it hidden for now, even if everything is filled in</span>
        </label>
        <label className="flex flex-col gap-1">
          Note to self (only you see this)
          <input
            name="admin_note"
            defaultValue={listing?.admin_note ?? ""}
            placeholder="e.g. ask agent for the price and if it has a kitchen"
            className={input}
          />
        </label>
      </div>

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
