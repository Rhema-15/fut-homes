// The places students search by. Top locations are fixed here. Sub-areas
// (streets, junctions) come from listings, plus the ones we already know.

export const LOCATIONS = {
  gk: { label: "GK", full: "Gidan Kwano (GK)", areas: ["Talba Road", "KFF Road", "Front of School"] },
  dama: { label: "Dama", full: "Dama", areas: [] },
  gidan_painti: { label: "Gidan Painti", full: "Gidan Painti", areas: [] },
  bosso: { label: "Bosso", full: "Bosso", areas: [] },
  gidan_mangoro: { label: "Gidan Mangoro", full: "Gidan Mangoro", areas: [] },
} as const satisfies Record<string, { label: string; full: string; areas: readonly string[] }>;

export type LocationId = keyof typeof LOCATIONS;

export function isLocation(v: string | null | undefined): v is LocationId {
  return !!v && Object.prototype.hasOwnProperty.call(LOCATIONS, v);
}

// "Talba Road, GK". If the area is just the location's own name, say it once.
export function whereLabel(location: string | null | undefined, area: string | null | undefined): string | null {
  const a = area?.trim() || null;
  if (!isLocation(location)) return a;
  const { label, full } = LOCATIONS[location];
  if (!a || a.toLowerCase() === label.toLowerCase() || a.toLowerCase() === full.toLowerCase()) return full;
  return `${a}, ${label}`;
}

export function placeLabel(l: { location?: string | null; area: string | null }): string | null {
  return whereLabel(l.location, l.area);
  }
