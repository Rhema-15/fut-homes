"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState, pathList, saveError, text, videoPath } from "@/lib/form-utils";
import { CAMPUSES, ROOM_TYPES, isOneOf } from "@/lib/options";

type Parsed =
  | { error: string }
  | {
      fields: Record<string, string | number | null>;
      photos: string[];
    };

function parse(formData: FormData): Parsed {
  const agentId = text(formData, "agent_id");
  const title = text(formData, "title");
  const roomType = text(formData, "room_type");
  const campus = text(formData, "campus");
  const area = text(formData, "area");
  const priceDigits = text(formData, "price").replace(/\D/g, "");
  const distanceText = text(formData, "distance_km").replace(",", ".");
  const distance = distanceText ? Number(distanceText) : null;
  const videoSecondsDigits = text(formData, "video_seconds").replace(/\D/g, "");
  const feesNote = text(formData, "fees_note");
  const description = text(formData, "description");
  const photos = pathList(formData, "photos");
  const video = videoPath(formData, "video");

  if (!agentId) return { error: "Pick the agent for this room." };
  if (!title) return { error: "Give the listing a short title." };
  if (!isOneOf(ROOM_TYPES, roomType)) return { error: "Pick a room type." };
  if (!isOneOf(CAMPUSES, campus)) return { error: "Pick the nearest campus." };
  if (!priceDigits) return { error: "Enter the rent per year." };
  if (distance !== null && (!Number.isFinite(distance) || distance < 0 || distance > 50)) {
    return { error: "Distance should be in km, like 1.2." };
  }
  if (photos.length === 0) return { error: "Add at least one photo." };

  return {
    photos,
    fields: {
      agent_id: agentId,
      title,
      room_type: roomType,
      campus,
      area: area || null,
      price: Number(priceDigits),
      distance_km: distance === null ? null : Math.round(distance * 10) / 10,
      fees_note: feesNote || null,
      description: description || null,
      video_path: video,
      video_seconds: video && videoSecondsDigits ? Number(videoSecondsDigits) : null,
    },
  };
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { data: listing, error } = await supabase.from("listings").insert(parsed.fields).select("id").single();
  if (error || !listing) return { error: saveError("listing", error?.message ?? "unknown error") };

  const { error: photoError } = await supabase
    .from("listing_photos")
    .insert(parsed.photos.map((path, position) => ({ listing_id: listing.id, path, position })));

  if (photoError) {
    // Don't leave a listing without photos behind.
    await supabase.from("listings").delete().eq("id", listing.id);
    return { error: saveError("photos", photoError.message) };
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

  const { error } = await supabase.from("listings").update(parsed.fields).eq("id", id);
  if (error) return { error: saveError("listing", error.message) };

  // Replace the photo list with what's on the form now.
  const { error: delError } = await supabase.from("listing_photos").delete().eq("listing_id", id);
  if (delError) return { error: saveError("photos", delError.message) };
  const { error: photoError } = await supabase
    .from("listing_photos")
    .insert(parsed.photos.map((path, position) => ({ listing_id: id, path, position })));
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

export async function setListingStatus(id: string, status: "available" | "taken") {
  const supabase = await createClient();
  await supabase
    .from("listings")
    .update({ status, taken_at: status === "taken" ? new Date().toISOString() : null })
    .eq("id", id);
  redirect("/admin/listings");
}

export async function setListingPublished(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("listings").update({ is_published: isPublished }).eq("id", id);
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
