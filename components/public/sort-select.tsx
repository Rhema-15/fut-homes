"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORTS, type Sort } from "@/lib/sorts";

export default function SortSelect({ value }: { value: Sort }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <span className="sr-only">Sort</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "near") next.delete("sort");
          else next.set("sort", e.target.value);
          const q = next.toString();
          router.push(q ? `/rooms?${q}` : "/rooms");
        }}
        className="h-9 rounded-full border-2 border-ink bg-white px-3 text-[13px] font-bold text-ink"
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
