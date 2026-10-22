// What Rhema has checked about an agent. Badges only ever claim what's
// ticked here.
export type AgentChecks = {
  long_time_poster: boolean;
  still_posting: boolean;
  students_confirmed: boolean;
};

export type BadgeLevel = "trusted" | "verified" | null;

// Trusted: past students confirmed. Verified: a posting track record.
// Nothing ticked: no badge at all.
export function badgeLevel(c: AgentChecks): BadgeLevel {
  if (c.students_confirmed) return "trusted";
  if (c.long_time_poster || c.still_posting) return "verified";
  return null;
}

export const BADGE_LABEL = { trusted: "Verified home", verified: "Verified home" } as const;

export function checkLines(c: AgentChecks): string[] {
  return [
    c.long_time_poster ? "Has been posting rooms around FUT for a long time" : null,
    c.still_posting ? "Still actively posting rooms" : null,
    c.students_confirmed ? "Past students confirmed they rented through the agent on this listing" : null,
  ].filter((l): l is string => l !== null);
}

export function readChecks(formData: FormData): AgentChecks {
  return {
    long_time_poster: formData.get("long_time_poster") === "on",
    still_posting: formData.get("still_posting") === "on",
    students_confirmed: formData.get("students_confirmed") === "on",
  };
}
