export type FormState = { error: string | null };

export function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function pathList(formData: FormData, key: string): string[] {
  try {
    const value: unknown = JSON.parse(String(formData.get(key) ?? "[]"));
    return Array.isArray(value)
      ? value.filter((p): p is string => typeof p === "string" && /^(agents|listings)\/[\w-]+\.(jpg|webp)$/.test(p))
      : [];
  } catch {
    return [];
  }
}

export function videoPath(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "");
  return /^listings\/[\w-]+\.(mp4|webm|mov)$/.test(value) ? value : null;
}

// Turns a Supabase error into a message Rhema can act on.
export function saveError(what: string, message: string): string {
  if (/jwt|token|unauthori[sz]ed|expired|signature/i.test(message)) {
    return "Your login has expired. Click Log out at the top, log back in, then try again.";
  }
  return `Couldn't save the ${what}: ${message}`;
}
