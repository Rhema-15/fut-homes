"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORTS, type Sort } from "@/lib/sorts";

export default function SortSelect({ value }: { value: Sort }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-muted">
      Sort
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "near") next.delete("sort");
          else next.set("sort", e.target.value);
          const q = next.toString();
          router.push(q ? `/rooms?${q}` : "/rooms");
        }}
        className="h-9 rounded-sm border border-control-border bg-white px-2 text-sm font-semibold text-ink"
      >
        {Object.entries(SORTS).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
