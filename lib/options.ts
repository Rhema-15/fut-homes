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
  id_verified: "ID verified",
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
  return "₦" + amount.toLocaleString("en-NG");
}

export function photoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}
