export type FormState = { error: string | null };

export function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function pathList(formData: FormData, key: string): string[] {
  try {
    const value: unknown = JSON.parse(String(formData.get(key) ?? "[]"));
    return Array.isArray(value)
      ? value.filter((p): p is string => typeof p === "string" && /^(agents|listings)\/[\w-]+\.jpg$/.test(p))
      : [];
  } catch {
    return [];
  }
}

export function videoPath(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "");
  return /^listings\/[\w-]+\.(mp4|webm|mov)$/.test(value) ? value : null;
}
