"use client";

import { useState } from "react";
import { LOCATIONS, isLocation } from "@/lib/locations";
import { BUDGETS, ROOM_TYPES, formatNaira } from "@/lib/options";
import type { AreaSummary, Filters } from "@/lib/public-data";
import ThemedSelect from "./themed-select";

// Pick a main location (GK, Dama...), then optionally a sub-area (Talba Road...).
// A plain GET form underneath: the hidden inputs carry the choices to /rooms.
export default function SearchForm({
  filters,
  areas,
  submitLabel = "Search rooms",
}: {
  filters?: Partial<Filters>;
  areas: AreaSummary[];
  submitLabel?: string;
}) {
  const [location, setLocation] = useState(filters?.location ?? "");
  const [area, setArea] = useState(filters?.area ?? "");
  const [type, setType] = useState(filters?.type ?? "");
  const [max, setMax] = useState(filters?.max ? String(filters.max) : "");

  const loc = isLocation(location) ? LOCATIONS[location] : null;
  const ownName = (a: string) => !!loc && [loc.label, loc.full].some((n) => n.toLowerCase() === a.toLowerCase());
  const subAreas = areas.filter((a) => (location ? a.location === location : true) && !ownName(a.area));
  const showArea = location ? subAreas.length > 0 : area !== "";

  return (
    <form action="/rooms" method="get" className="flex flex-col gap-3">
      <ThemedSelect
        name="where"
        label="Where?"
        title="Choose a location"
        value={location}
        onChange={(v) => {
          setLocation(v);
          setArea("");
        }}
        options={[
          { value: "", label: "Anywhere near FUT" },
          ...Object.entries(LOCATIONS).map(([value, l]) => ({ value, label: l.full })),
        ]}
      />

      {showArea && (
        <ThemedSelect
          name="area"
          label={loc ? `Area in ${loc.label}` : "Area"}
          title={loc ? `Areas in ${loc.label}` : "Choose an area"}
          value={area}
          onChange={setArea}
          options={[
            { value: "", label: loc ? `All of ${loc.label}` : "Any area" },
            ...(area && !subAreas.some((a) => a.area.toLowerCase() === area.toLowerCase()) ? [{ value: area, label: area }] : []),
            ...subAreas.map((a) => ({ value: a.area, label: a.area, hint: `${a.count} room${a.count === 1 ? "" : "s"}` })),
          ]}
        />
      )}
      {!showArea && <input type="hidden" name="area" value="" />}

      <div className="grid grid-cols-2 gap-2">
        <ThemedSelect
          name="type"
          label="Room type"
          title="Room type"
          value={type}
          onChange={setType}
          options={[{ value: "", label: "Any" }, ...Object.entries(ROOM_TYPES).map(([value, label]) => ({ value, label }))]}
        />
        <ThemedSelect
          name="max"
          label="Max budget"
          title="Your budget"
          value={max}
          onChange={setMax}
          options={[{ value: "", label: "Any budget" }, ...BUDGETS.map((b) => ({ value: String(b), label: `Up to ${formatNaira(b)}` }))]}
        />
      </div>

      {filters?.sort && filters.sort !== "near" && <input type="hidden" name="sort" value={filters.sort} />}

      <button
        type="submit"
        className="mt-0.5 flex h-[50px] items-center justify-center gap-2 rounded-[14px] border-2 border-ink bg-brand-700 text-[17px] font-extrabold text-white active:translate-x-px active:translate-y-px"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {submitLabel}
      </button>
    </form>
  );
}
