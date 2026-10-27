"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState, pathList, saveError, text, videoPath } from "@/lib/form-utils";
import { CAMPUSES, ROOM_TYPES, isOneOf, normalizeWhatsapp } from "@/lib/options";
import { badgeLevel } from "@/lib/agent-checks";
import { cleanAmenities } from "@/lib/amenities";
import { missingDetails } from "@/lib/listing-state";

type Parsed =
  | { error: string }
  | {
      fields: Record<string, string | number | boolean | string[] | null>;
      photos: string[];
    };

function parse(formData: FormData): Parsed {
  const draft = formData.get("draft") === "on";
  const agentId = text(formData, "agent_id");
  const title = text(formData, "title");
  const roomType = text(formData, "room_type");
  const roommateGender = text(formData, "roommate_gender");
  const rentMonthsNum = Number(text(formData, "rent_months"));
  const campus = text(formData, "campus");
  const area = text(formData, "area");
  const priceDigits = text(formData, "price").replace(/\D/g, "");
  const distanceText = text(formData, "distance_km").replace(",", ".");
  const distance = distanceText ? Number(distanceText) : null;
  const videoSecondsDigits = text(formData, "video_seconds").replace(/\D/g, "");
  const feesNote = text(formData, "fees_note");
  const agentFeeDigits = text(formData, "agent_fee").replace(/\D/g, "");
  const cautionFeeDigits = text(formData, "caution_fee").replace(/\D/g, "");
  const amenities = cleanAmenities(formData.getAll("amenities"));
  const description = text(formData, "description");
  const photos = pathList(formData, "photos");
  const video = videoPath(formData, "video");

  // Nothing is required: a room with details missing saves hidden, with a
  // note of what's missing, so Rhema can come back to it.
  if (roomType && !isOneOf(ROOM_TYPES, roomType)) return { error: "Pick a room type from the list." };
  if (campus && !isOneOf(CAMPUSES, campus)) return { error: "Pick a campus from the list." };
  if (distance !== null && (!Number.isFinite(distance) || distance < 0 || distance > 50)) {
    return { error: "Distance should be in km, like 1.2." };
  }
  const price = priceDigits ? Number(priceDigits) : null;
  const missing = missingDetails({ agent_id: agentId, room_type: roomType || null, campus: campus || null, price, photoCount: photos.length });
  const hide = draft || missing.length > 0;
  const autoTitle =
    title ||
    [roomType && isOneOf(ROOM_TYPES, roomType) ? ROOM_TYPES[roomType] : "Room", area ? `in ${area}` : ""].filter(Boolean).join(" ");

  return {
    photos,
    fields: {
      agent_id: agentId || null,
      title: autoTitle,
      room_type: roomType || null,
      campus: campus || null,
      area: area || null,
      price,
      distance_km: distance === null ? null : Math.round(distance * 10) / 10,
      fees_note: feesNote || null,
      agent_fee: agentFeeDigits ? Number(agentFeeDigits) : null,
      caution_fee: cautionFeeDigits ? Number(cautionFeeDigits) : null,
            rent_months: rentMonthsNum >= 1 && rentMonthsNum < 12 ? Math.round(rentMonthsNum) : null,
      roommate_gender: roomType === "shared" && ["female", "male", "any"].includes(roommateGender) ? roommateGender : null,
      amenities,
      description: description || null,
      video_path: video,
      video_seconds: video && videoSecondsDigits ? Number(videoSecondsDigits) : null,
      admin_note: text(formData, "admin_note") || null,
      ...(hide ? { is_published: false } : {}),
    },
  };
}

// Before SQL 007 is run these columns don't exist yet: save without them.
const NEW_FIELDS = ["amenities", "agent_fee", "caution_fee", "admin_note", "roommate_gender", "rent_months"];
function missingColumn(error: { code?: string; message: string } | null) {
  return !!error && (error.code === "42703" || error.code === "PGRST204");
}
// Before SQL 008 the database still insists on type, campus and price.
function needsSql008(error: { code?: string; message: string } | null) {
  return !!error && (error.code === "23502" || error.code === "23514");
}
const SQL_008 =
  "Some details are missing and the database doesn't allow that yet. Run SQL 008 in Supabase once (ask Claude for it), then save again.";

function withoutNewFields(fields: Parsed & { fields: object }) {
  return Object.fromEntries(Object.entries(fields.fields).filter(([k]) => !NEW_FIELDS.includes(k)));
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();

  // "+ New agent" picked: add them first (or reuse one with the same number).
  if (parsed.fields.agent_id === "__new") {
    const name = text(formData, "new_agent_name");
    const whatsapp = normalizeWhatsapp(text(formData, "new_agent_whatsapp"));
    if (!name) return { error: "Enter the new agent's name." };
    if (!whatsapp) return { error: "Enter the new agent's WhatsApp number, like 0803 123 4567." };
    const { data: same } = await supabase.from("agents").select("id").eq("whatsapp", whatsapp).limit(1);
    if (same && same.length) {
      parsed.fields.agent_id = same[0].id;
    } else {
      const checks = {
        long_time_poster: formData.get("new_agent_long_time_poster") === "on",
        still_posting: formData.get("new_agent_still_posting") === "on",
        students_confirmed: formData.get("new_agent_students_confirmed") === "on",
      };
      const level = badgeLevel(checks);
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .insert({
          name,
          whatsapp,
          ...checks,
          is_trusted: level === "trusted",
          verification_level: level === "trusted" ? "trusted" : "id_verified",
        })
        .select("id")
        .single();
      if (agentError || !agent) return { error: saveError("agent", agentError?.message ?? "unknown error") };
      parsed.fields.agent_id = agent.id;
    }
  }

  let { data: listing, error } = await supabase.from("listings").insert(parsed.fields).select("id").single();
  if (missingColumn(error)) {
    ({ data: listing, error } = await supabase.from("listings").insert(withoutNewFields(parsed)).select("id").single());
  }
  if (needsSql008(error)) return { error: SQL_008 };
  if (error || !listing) return { error: saveError("listing", error?.message ?? "unknown error") };

  const { error: photoError } = parsed.photos.length
    ? await supabase
        .from("listing_photos")
        .insert(parsed.photos.map((path, position) => ({ listing_id: listing.id, path, position })))
    : { error: null };

  if (photoError) {
    // Don't leave a listing without photos behind.
    await supabase.from("listings").delete().eq("id", listing.id);
    return { error: saveError("photos", photoError.message) };
  }

  // "Save & add another" opens a fresh form (the timestamp resets it).
  if (formData.get("after") === "new") {
    redirect(`/admin/listings/new?added=${Date.now()}${parsed.fields.agent_id ? `&agent=${parsed.fields.agent_id}` : ""}`);
  }
  redirect("/admin/listings");
}

export async function updateListing(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("listings")
    .select("video_path, listing_photos(path)")
    .eq("id", id)
    .single();

  let { error } = await supabase.from("listings").update(parsed.fields).eq("id", id);
  if (missingColumn(error)) ({ error } = await supabase.from("listings").update(withoutNewFields(parsed)).eq("id", id));
  if (needsSql008(error)) return { error: SQL_008 };
  if (error) return { error: saveError("listing", error.message) };

  // Replace the photo list with what's on the form now.
  const { error: delError } = await supabase.from("listing_photos").delete().eq("listing_id", id);
  if (delError) return { error: saveError("photos", delError.message) };
  const { error: photoError } = parsed.photos.length
    ? await supabase
        .from("listing_photos")
        .insert(parsed.photos.map((path, position) => ({ listing_id: id, path, position })))
    : { error: null };
  if (photoError) return { error: saveError("photos", photoError.message) };

  // Tidy up files that were removed, so storage doesn't fill up.
  if (before) {
    const oldPhotos = (before.listing_photos as { path: string }[]).map((p) => p.path);
    const gone = oldPhotos.filter((p) => !parsed.photos.includes(p));
    if (gone.length) await supabase.storage.from("photos").remove(gone);
    if (before.video_path && before.video_path !== parsed.fields.video_path) {
      await supabase.storage.from("videos").remove([before.video_path]);
    }
  }

  redirect("/admin/listings");
}

export async function setListingStatus(id: string, status: "available" | "taken", back = "/admin/listings") {
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("listings")
    .update(
      status === "taken"
        ? { status, taken_at: now }
        : // Marking available again means it was just checked.
          { status, taken_at: null, confirmed_at: now },
    )
    .eq("id", id);
  redirect(back);
}

// The agent said the room is still free: reset the 7/14-day clocks.
export async function confirmListing(id: string, back = "/admin") {
  const supabase = await createClient();
  await supabase.from("listings").update({ confirmed_at: new Date().toISOString() }).eq("id", id);
  redirect(back);
}

// Hide: keep the reason typed next to the button. Show: only once the room
// has everything students need; otherwise say what's missing.
export async function setListingPublished(id: string, isPublished: boolean, formData?: FormData) {
  const supabase = await createClient();
  if (!isPublished) {
    const note = formData ? text(formData, "admin_note") : "";
    let { error } = await supabase.from("listings").update({ is_published: false, admin_note: note || null }).eq("id", id);
    if (missingColumn(error)) ({ error } = await supabase.from("listings").update({ is_published: false }).eq("id", id));
    redirect(`/admin/listings/${id}`);
  }
  const { data: l } = await supabase
    .from("listings")
    .select("agent_id, room_type, campus, price, listing_photos(path)")
    .eq("id", id)
    .single();
  const missing = l
    ? missingDetails({ ...l, photoCount: (l.listing_photos as { path: string }[]).length })
    : ["listing"];
  if (missing.length) redirect(`/admin/listings/${id}?missing=${encodeURIComponent(missing.join(", "))}`);
  let { error } = await supabase.from("listings").update({ is_published: true, admin_note: null }).eq("id", id);
  if (missingColumn(error)) ({ error } = await supabase.from("listings").update({ is_published: true }).eq("id", id));
  redirect(`/admin/listings/${id}`);
}

export async function deleteListing(id: string) {
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("video_path, listing_photos(path)")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (!error && listing) {
    const photos = (listing.listing_photos as { path: string }[]).map((p) => p.path);
    if (photos.length) await supabase.storage.from("photos").remove(photos);
    if (listing.video_path) await supabase.storage.from("videos").remove([listing.video_path]);
  }
  redirect("/admin/listings");
  }
          
