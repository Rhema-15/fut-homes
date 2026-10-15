// "What's included" ticks on a listing. Keys are stored in listings.amenities.
// Order here is the order students see them.
export const AMENITIES = {
  running_water: "Running water",
  toilet_inside: "Toilet inside (WC)",
  kitchen: "Kitchen",
  prepaid_meter: "Prepaid meter",
  own_transformer: "Own transformer",
  fenced: "Fenced and gated",
  security: "Security",
  tiled: "Tiled floor",
  pop_ceiling: "POP ceiling",
  wardrobe: "Wardrobe",
  water_heater: "Water heater",
} as const;
export type Amenity = keyof typeof AMENITIES;

export function cleanAmenities(values: unknown): Amenity[] {
  if (!Array.isArray(values)) return [];
  const set = new Set(values.filter((v): v is Amenity => typeof v === "string" && v in AMENITIES));
  return (Object.keys(AMENITIES) as Amenity[]).filter((k) => set.has(k));
}
