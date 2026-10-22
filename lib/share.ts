import type { ShareCardData } from "@/lib/share-card";
import type { BadgeLevel } from "@/lib/agent-checks";
import { AMENITIES } from "@/lib/amenities";
import {
  ROOMMATE_GENDERS,
  ROOM_TYPES,
  type Campus,
  type RoomType,
  formatDistance,
  formatNaira,
  isPartial,
  listingCode,
  photoUrl,
  rentMonths,
  rentPeriodText,
  rentUnit,
} from "@/lib/options";

export const SITE_HOST = "fut-homes.name.ng";

export function shortLink(id: string) {
  return `${SITE_HOST}/r/${listingCode(id)}`;
}

type ListingLike = {
  id: string;
  room_type: RoomType;
  campus: Campus;
  area: string | null;
  distance_km: number | null;
  price: number;
  rent_months?: number | null;
  roommate_gender?: string | null;
  amenities?: readonly string[] | null;
  agent_fee?: number | null;
  caution_fee?: number | null;
  fees_note?: string | null;
  video_path: string | null;
  photos: string[];
  badge: BadgeLevel;
};

export function shareData(l: ListingLike): { card: ShareCardData; caption: string; fileName: string } {
  const type = ROOM_TYPES[l.room_type];
  const distance = formatDistance(l.distance_km, l.campus);
  const link = shortLink(l.id);
  const code = listingCode(l.id);
  const unit = rentUnit(l.rent_months, true);

  const tags: { text: string; tone: "warn" | "gender" }[] = [];
  if (isPartial(l.rent_months)) tags.push({ text: `Only ${rentMonths(l.rent_months)} months, not a full year`, tone: "warn" });
  const gender =
    l.room_type === "shared" && l.roommate_gender && l.roommate_gender in ROOMMATE_GENDERS
      ? ROOMMATE_GENDERS[l.roommate_gender as keyof typeof ROOMMATE_GENDERS]
      : null;
  if (gender) tags.push({ text: gender, tone: "gender" });

  const amenities: string[] = (l.amenities ?? []).map((a) => (AMENITIES as Record<string, string>)[a]).filter((a) => Boolean(a));

  const period = rentPeriodText(l.rent_months);
  const rows = [
    { label: l.room_type === "shared" ? `Your share of rent (${period})` : `Rent (${period})`, amount: l.price },
    l.agent_fee != null ? { label: "Agent fee", amount: l.agent_fee } : null,
    l.caution_fee != null ? { label: "Caution fee", amount: l.caution_fee } : null,
  ].filter((r): r is { label: string; amount: number } => r !== null);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const feeRows = rows.length > 1 ? rows.map((r) => ({ label: r.label, amount: formatNaira(r.amount) })) : [];

  const caption = [
    `${type}${l.area ? ` in ${l.area}` : ""}, ${formatNaira(l.price)}${unit}`,
    gender ? `${gender} (shared room, price is your share)` : null,
    isPartial(l.rent_months) ? `Only ${rentMonths(l.rent_months)} months, not a full year.` : null,
    distance,
    amenities.length > 0 ? `Includes: ${amenities.join(", ")}` : null,
    feeRows.length > 0 ? `${feeRows.map((r) => `${r.label}: ${r.amount}`).join(" | ")} | Total to move in: ${formatNaira(total)}` : null,
    l.fees_note ? `Also: ${l.fees_note}` : null,
    l.badge ? "Verified home on FUT Homes." : "On FUT Homes.",
    `${l.video_path ? "Watch the room video and book" : "See photos and book"} an inspection: https://${link}`,
    `Listing #${code}`,
    "Never pay before you inspect.",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    caption,
    fileName: `fut-homes-${code}.jpg`,
    card: {
      coverUrl: l.photos[0] ? photoUrl(l.photos[0]) : null,
      price: formatNaira(l.price),
      unit,
      roomType: type,
      area: l.area,
      distance,
      badge: l.badge,
      hasVideo: Boolean(l.video_path),
      shortLink: link,
      code,
      tags,
      amenities,
      fees: feeRows,
      total: feeRows.length > 0 ? formatNaira(total) : undefined,
      feesNote: l.fees_note ?? null,
    },
  };
}
