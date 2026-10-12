import { CAMPUSES, ROOM_TYPES, formatNaira } from "@/lib/options";
import { BUDGETS, type Filters } from "@/lib/public-data";

const selectClass =
  "h-12 w-full rounded-md border border-control-border bg-white px-3 text-base text-ink";

// Plain GET form: works without JavaScript and on the slowest phones.
export default function SearchForm({ filters, submitLabel = "Search rooms" }: { filters?: Partial<Filters>; submitLabel?: string }) {
  const campus = filters?.campus ?? "bosso";
  return (
    <form action="/rooms" method="get" className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Campus</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CAMPUSES).map(([value, label]) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="campus"
                value={value}
                defaultChecked={campus === value}
                className="peer sr-only"
              />
              <span className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-control-border bg-white text-[15px] font-semibold text-ink peer-checked:border-[1.5px] peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Room type
        <select name="type" defaultValue={filters?.type ?? ""} className={selectClass + " font-normal"}>
          <option value="">Any room type</option>
          {Object.entries(ROOM_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Max budget per year
        <select name="max" defaultValue={filters?.max ? String(filters.max) : ""} className={selectClass + " font-normal"}>
          <option value="">Any budget</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              Up to {formatNaira(b)}
            </option>
          ))}
        </select>
      </label>

      {filters?.sort && filters.sort !== "near" && <input type="hidden" name="sort" value={filters.sort} />}

      <button
        type="submit"
        className="flex h-12 items-center justify-center gap-2 rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {submitLabel}
      </button>
    </form>
  );
}
