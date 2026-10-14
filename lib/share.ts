import type { ShareCardData } from "@/lib/share-card";
import { ROOM_TYPES, type Campus, type RoomType, formatDistance, formatNaira, listingCode, photoUrl } from "@/lib/options";

export const SITE_HOST = "fut-homes.vercel.app";

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
  video_path: string | null;
  photos: string[];
  is_trusted: boolean;
};

export function shareData(l: ListingLike): { card: ShareCardData; caption: string; fileName: string } {
  const type = ROOM_TYPES[l.room_type];
  const distance = formatDistance(l.distance_km, l.campus);
  const link = shortLink(l.id);
  const caption = [
    `${type}${l.area ? ` in ${l.area}` : ""}, ${formatNaira(l.price)}/year`,
    distance,
    l.is_trusted ? "Trusted agent on FUT Homes." : "ID-checked agent on FUT Homes.",
    `${l.video_path ? "Watch the room video and book" : "See photos and book"} an inspection: https://${link}`,
    "Never pay before you inspect.",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    caption,
    fileName: `fut-homes-${listingCode(l.id)}.jpg`,
    card: {
      coverUrl: l.photos[0] ? photoUrl(l.photos[0]) : null,
      price: formatNaira(l.price),
      roomType: type,
      area: l.area,
      distance,
      isTrusted: l.is_trusted,
      hasVideo: Boolean(l.video_path),
      shortLink: link,
    },
  };
}
