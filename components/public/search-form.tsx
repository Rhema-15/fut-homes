import { ROOM_TYPES, formatNaira } from "@/lib/options";
import { type AreaSummary, BUDGETS, type Filters } from "@/lib/public-data";

const select =
  "h-11 w-full rounded-[12px] border-2 border-ink bg-white px-2.5 text-[15px] font-medium text-ink";

// Plain GET form: works without JavaScript and on the slowest phones.
export default function SearchForm({
  filters,
  areas,
  submitLabel = "Search rooms",
}: {
  filters?: Partial<Filters>;
  areas: AreaSummary[];
  submitLabel?: string;
}) {
  const where = filters?.area ? `area:${filters.area}` : (filters?.campus ?? "");
  return (
    <form action="/rooms" method="get" className="flex flex-col gap-2.5">
      <label className="flex flex-col gap-1 text-[13px] font-bold">
        Where?
        <select name="where" defaultValue={where} className={select}>
          <option value="">Anywhere near FUT</option>
          <option value="bosso">Near Bosso campus</option>
          <option value="gidan_kwano">Near Gidan Kwano campus</option>
          {areas.length > 0 && (
            <optgroup label="Areas">
              {areas.map((a) => (
                <option key={a.area} value={`area:${a.area}`}>
                  {a.area}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[13px] font-bold">
          Room type
          <select name="type" defaultValue={filters?.type ?? ""} className={select}>
            <option value="">Any</option>
            {Object.entries(ROOM_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-bold">
          Max budget
          <select name="max" defaultValue={filters?.max ? String(filters.max) : ""} className={select}>
            <option value="">Any budget</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {formatNaira(b)}
              </option>
            ))}
          </select>
        </label>
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
