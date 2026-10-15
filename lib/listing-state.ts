// Why a room isn't on the public site, in words Rhema can act on.
// Used by the admin listings list and the edit page.

export const HIDE_AFTER_DAYS = 14; // same as lib/public-data.ts
const TAKEN_SHOWN_DAYS = 7;

type Shape = {
  agent_id?: string | null;
  room_type: string | null;
  campus: string | null;
  price: number | null;
  photoCount: number;
};

// Details a room needs before students can see it.
export function missingDetails(l: Shape): string[] {
  const missing: string[] = [];
  if (!l.agent_id) missing.push("agent");
  if (!l.room_type) missing.push("room type");
  if (!l.campus) missing.push("campus");
  if (!l.price || l.price <= 0) missing.push("price");
  if (l.photoCount === 0) missing.push("photos");
  return missing;
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// null when the room is live on the site.
export function offSiteReason(
  l: Shape & {
    is_published: boolean;
    admin_note?: string | null;
    status: "available" | "taken";
    confirmed_at?: string | null;
    taken_at?: string | null;
    agent_active?: boolean | null;
  },
): string | null {
  const missing = missingDetails(l);
  if (!l.is_published) {
    const parts = ["Hidden"];
    if (l.admin_note) parts.push(l.admin_note);
    if (missing.length) parts.push(`Missing: ${missing.join(", ")}`);
    if (parts.length === 1) parts.push("no reason noted");
    return parts.join(" · ");
  }
  if (l.agent_active === false) return "Off site: the agent is hidden";
  if (l.status === "taken") {
    const d = daysSince(l.taken_at);
    return d !== null && d > TAKEN_SHOWN_DAYS ? "Off site: taken over a week ago" : null;
  }
  const d = daysSince(l.confirmed_at);
  if (d !== null && d > HIDE_AFTER_DAYS) return `Off site: not confirmed for ${d} days. Ask the agent if it's still free`;
  return null;
}
