"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CAMPUSES, ROOM_TYPES, type Campus, type RoomType, formatNaira } from "@/lib/options";

type Item = {
  key: string;
  agentMatch: string;
  title: string;
  room_type: RoomType;
  campus: Campus | null; // null: pick on this page
  area: string | null;
  distance_km: number | null;
  price: number;
  fees_note: string | null;
  description: string | null;
  video: { file: string; seconds: number } | null;
  photos: string[];
};

type Status = "ready" | "working" | "done" | "exists" | "error";

const LOGIN_EXPIRED = "Your login has expired. Log out, log back in, then try again.";

export default function ImportClient({
  agents,
  existing,
}: {
  agents: { id: string; name: string }[];
  existing: { agent_id: string; title: string; price: number }[];
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agentFor, setAgentFor] = useState<Record<string, string>>({});
  const [campusFor, setCampusFor] = useState<Record<string, Campus>>({});
  const [status, setStatus] = useState<Record<string, { s: Status; msg?: string }>>({});

  useEffect(() => {
    fetch("/_import/batch.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("No listings waiting."))))
      .then((data: { listings: Item[] }) => {
        setItems(data.listings);
        const picks: Record<string, string> = {};
        const st: Record<string, { s: Status }> = {};
        for (const item of data.listings) {
          const match = item.agentMatch
            ? agents.find((a) => a.name.toLowerCase().includes(item.agentMatch.toLowerCase()))
            : undefined;
          if (match) picks[item.key] = match.id;
          const dup = existing.some(
            (e) => e.title === item.title && e.price === item.price && (!match || e.agent_id === match.id),
          );
          st[item.key] = { s: dup ? "exists" : "ready" };
        }
        setAgentFor(picks);
        setStatus(st);
      })
      .catch((e) => setLoadError(e.message));
  }, [agents, existing]);

  function set(key: string, s: Status, msg?: string) {
    setStatus((cur) => ({ ...cur, [key]: { s, msg } }));
  }

  async function importOne(item: Item) {
    const agentId = agentFor[item.key];
    if (!agentId) return set(item.key, "error", "Pick the agent first.");
    const campus = item.campus ?? campusFor[item.key];
    if (!campus) return set(item.key, "error", "Pick the campus first.");
    set(item.key, "working", "Checking login…");
    const supabase = createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) return set(item.key, "error", LOGIN_EXPIRED);

    const uploaded: { bucket: string; path: string }[] = [];
    try {
      async function upload(bucket: "photos" | "videos", file: string, ext: string, type: string) {
        const res = await fetch(`/_import/${file}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Missing file ${file}`);
        const blob = await res.blob();
        const path = `listings/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, blob, { contentType: type, cacheControl: "31536000" });
        if (error) throw error;
        uploaded.push({ bucket, path });
        return path;
      }

      const photoPaths: string[] = [];
      for (let i = 0; i < item.photos.length; i++) {
        set(item.key, "working", `Uploading photo ${i + 1} of ${item.photos.length}…`);
        photoPaths.push(await upload("photos", item.photos[i], "webp", "image/webp"));
      }
      let videoPath: string | null = null;
      if (item.video) {
        set(item.key, "working", "Uploading video…");
        videoPath = await upload("videos", item.video.file, "mp4", "video/mp4");
      }

      set(item.key, "working", "Saving listing…");
      const { data: listing, error } = await supabase
        .from("listings")
        .insert({
          agent_id: agentId,
          title: item.title,
          room_type: item.room_type,
          campus,
          area: item.area,
          distance_km: item.distance_km,
          price: item.price,
          fees_note: item.fees_note,
          description: item.description,
          video_path: videoPath,
          video_seconds: item.video?.seconds ?? null,
        })
        .select("id")
        .single();
      if (error || !listing) throw error ?? new Error("Couldn't save the listing");

      const { error: photoError } = await supabase
        .from("listing_photos")
        .insert(photoPaths.map((path, position) => ({ listing_id: listing.id, path, position })));
      if (photoError) {
        await supabase.from("listings").delete().eq("id", listing.id);
        throw photoError;
      }
      set(item.key, "done", `/rooms/${listing.id}`);
    } catch (e) {
      // Don't leave half-uploaded files behind.
      for (const u of uploaded) await supabase.storage.from(u.bucket).remove([u.path]);
      const msg = (e as Error).message ?? String(e);
      set(item.key, "error", /jwt|token|unauthori[sz]ed|expired|signature/i.test(msg) ? LOGIN_EXPIRED : msg);
    }
  }

  async function importAll() {
    for (const item of items ?? []) {
      if (status[item.key]?.s === "ready" || status[item.key]?.s === "error") await importOne(item);
    }
  }

  if (loadError) return <p className="mt-6 text-sm text-neutral-500">{loadError}</p>;
  if (!items) return <p className="mt-6 text-sm text-neutral-500">Loading…</p>;
  if (items.length === 0) return <p className="mt-6 text-sm text-neutral-500">No listings waiting.</p>;

  const waiting = items.filter((i) => ["ready", "error"].includes(status[i.key]?.s ?? "")).length;
  const busy = Object.values(status).some((s) => s.s === "working");

  return (
    <div className="mt-6 flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const st = status[item.key] ?? { s: "ready" };
          return (
            <li key={item.key} className="rounded-lg border border-neutral-200 p-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/_import/${item.photos[0]}`} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-neutral-500">
                    {ROOM_TYPES[item.room_type]}
                    {item.campus ? ` · ${CAMPUSES[item.campus]}` : ""} · {formatNaira(item.price)}/yr
                  </p>
                  <p className="text-neutral-500">
                    {item.photos.length} photos{item.video ? " + video" : ""}
                  </p>
                </div>
              </div>

              <label className="mt-3 flex flex-col gap-1 text-sm">
                Agent
                <select
                  value={agentFor[item.key] ?? ""}
                  onChange={(e) => setAgentFor((cur) => ({ ...cur, [item.key]: e.target.value }))}
                  disabled={st.s === "done" || st.s === "working"}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-base"
                >
                  <option value="">Choose agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              {!item.campus && (
                <label className="mt-3 flex flex-col gap-1 text-sm">
                  Campus
                  <select
                    value={campusFor[item.key] ?? ""}
                    onChange={(e) => setCampusFor((cur) => ({ ...cur, [item.key]: e.target.value as Campus }))}
                    disabled={st.s === "done" || st.s === "working"}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-base"
                  >
                    <option value="">Choose campus</option>
                    {Object.entries(CAMPUSES).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="mt-3 text-sm">
                {st.s === "done" && st.msg && (
                  <p className="text-green-700">
                    Done.{" "}
                    <a href={st.msg} className="underline" target="_blank">
                      View on site
                    </a>
                  </p>
                )}
                {st.s === "exists" && (
                  <p className="text-neutral-500">
                    Already on the site.{" "}
                    <button type="button" className="underline" onClick={() => set(item.key, "ready")}>
                      Import again anyway
                    </button>
                  </p>
                )}
                {st.s === "working" && <p className="text-neutral-700">{st.msg}</p>}
                {st.s === "error" && <p className="text-red-600">{st.msg}</p>}
                {(st.s === "ready" || st.s === "error") && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => importOne(item)}
                    className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 font-medium disabled:opacity-50"
                  >
                    {st.s === "error" ? "Try again" : "Import this one"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {waiting > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={importAll}
          className="rounded-md bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {busy ? "Importing… keep this page open" : `Import all (${waiting})`}
        </button>
      )}
      <p className="text-xs text-neutral-500">
        After importing, open each room on the site to check it. Area and distance can be added with Edit.
      </p>
    </div>
  );
}
