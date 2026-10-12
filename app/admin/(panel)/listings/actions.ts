"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState, pathList, text, videoPath } from "@/lib/form-utils";
import { CAMPUSES, ROOM_TYPES, isOneOf } from "@/lib/options";

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const agentId = text(formData, "agent_id");
  const title = text(formData, "title");
  const roomType = text(formData, "room_type");
  const campus = text(formData, "campus");
  const area = text(formData, "area");
  const priceDigits = text(formData, "price").replace(/\D/g, "");
  const walkDigits = text(formData, "walk_minutes").replace(/\D/g, "");
  const feesNote = text(formData, "fees_note");
  const description = text(formData, "description");
  const photos = pathList(formData, "photos");
  const video = videoPath(formData, "video");

  if (!agentId) return { error: "Pick the agent for this room." };
  if (!title) return { error: "Give the listing a short title." };
  if (!isOneOf(ROOM_TYPES, roomType)) return { error: "Pick a room type." };
  if (!isOneOf(CAMPUSES, campus)) return { error: "Pick the nearest campus." };
  if (!priceDigits) return { error: "Enter the rent per year." };
  if (photos.length === 0) return { error: "Add at least one photo." };

  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      agent_id: agentId,
      title,
      room_type: roomType,
      campus,
      area: area || null,
      price: Number(priceDigits),
      walk_minutes: walkDigits ? Number(walkDigits) : null,
      fees_note: feesNote || null,
      description: description || null,
      video_path: video,
    })
    .select("id")
    .single();

  if (error || !listing) return { error: `Couldn't save the listing: ${error?.message ?? "unknown error"}` };

  const { error: photoError } = await supabase
    .from("listing_photos")
    .insert(photos.map((path, position) => ({ listing_id: listing.id, path, position })));

  if (photoError) {
    // Don't leave a listing without photos behind.
    await supabase.from("listings").delete().eq("id", listing.id);
    return { error: `Couldn't save the photos: ${photoError.message}` };
  }

  redirect("/admin/listings");
}
