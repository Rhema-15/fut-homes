// Shared choices and small helpers used by forms and pages.

export const ROOM_TYPES = {
  single_room: "Single room",
  self_contain: "Self-contain",
  room_parlour: "Room and parlour",
  flat: "Flat",
  shared: "Shared room",
} as const;
export type RoomType = keyof typeof ROOM_TYPES;

export const CAMPUSES = {
  bosso: "Bosso",
  gidan_kwano: "Gidan Kwano",
} as const;
export type Campus = keyof typeof CAMPUSES;

export const VERIFICATION_LEVELS = {
  id_verified: "Verified",
  trusted: "Trusted agent",
} as const;
export type VerificationLevel = keyof typeof VERIFICATION_LEVELS;

export function isOneOf<T extends object>(
  options: T,
  value: string,
): value is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(options, value);
}

// Turns 0803 123 4567, +234 803..., 234803... into 2348031234567.
// Returns null if it isn't a Nigerian mobile number.
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  }
  return /^234[789]\d{9}$/.test(digits) ? digits : null;
}

export function formatWhatsapp(digits: string): string {
  return digits.startsWith("234") ? "0" + digits.slice(3) : digits;
}

export function formatNaira(amount: number): string {
  return "₦" + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const CAMPUS_LONG = {
  bosso: "Bosso campus",
  gidan_kwano: "Gidan Kwano campus",
} as const;

export function formatDistance(km: number | null, campus: Campus): string | null {
  if (km === null || km === undefined) return null;
  return `${Number(km).toFixed(1)} km to ${CAMPUS_LONG[campus]}`;
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

// Short, readable listing number for WhatsApp messages and reports.
export function listingCode(id: string): string {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function photoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

export function videoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${path}`;
}

// "Confirmed available today / yesterday / 5 days ago"
export function confirmedAgo(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Confirmed available today";
  if (days === 1) return "Confirmed available yesterday";
  return `Confirmed available ${days} days ago`;
}

// Short form for cards: "0.8 km to GK".
export function formatDistanceShort(km: number | null, campus: Campus): string | null {
  if (km === null || km === undefined) return null;
  return `${Number(km).toFixed(1)} km to ${campus === "bosso" ? "Bosso" : "GK"}`;
}

// Short money for tight spots: ₦180k, ₦1.2m.
export function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${Number((amount / 1_000_000).toFixed(1))}m`;
  if (amount >= 1000) return `₦${Math.round(amount / 1000)}k`;
  return formatNaira(amount);
}

export const ROOMMATE_GENDERS = { female: "Females only", male: "Males only", any: "Any gender" } as const;

export function genderNote(roomType: string, gender: string | null): string {
  if (roomType !== "shared" || !gender || !(gender in ROOMMATE_GENDERS)) return "";
  return ` · ${ROOMMATE_GENDERS[gender as keyof typeof ROOMMATE_GENDERS].toLowerCase()}`;
}
