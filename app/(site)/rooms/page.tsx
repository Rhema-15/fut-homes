import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/public/icons";
import { ListingGrid } from "@/components/public/listing-card";
import SearchForm from "@/components/public/search-form";
import SortSelect from "@/components/public/sort-select";
import { CAMPUSES, ROOM_TYPES, formatNaira } from "@/lib/options";
import { type AreaSummary, BUDGETS, type Filters, filtersToQuery, listAreas, readFilters, searchListings } from "@/lib/public-data";

export const instant = false;

export async function generateMetadata({ searchParams }: PageProps<"/rooms">): Promise<Metadata> {
  const f = readFilters(await searchParams);
  return { title: f.area ? `Rooms in ${f.area}` : f.campus ? `Rooms near ${CAMPUSES[f.campus]}` : "Rooms near FUTMINNA" };
}

const chipOn =
  "inline-flex h-9 flex-none items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3.5 text-sm font-bold text-white";
const chipOff =
  "inline-flex h-9 flex-none items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3.5 text-sm font-bold text-ink";

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const filters = readFilters(await searchParams);
  const [rooms, areas] = await Promise.all([
    searchListings(filters),
    listAreas().catch(() => [] as AreaSummary[]),
  ]);
  const heading = filters.area
    ? `Rooms in ${filters.area}`
    : filters.campus
      ? `Rooms near ${CAMPUSES[filters.campus]}`
      : "All rooms";
  const available = rooms.filter((r) => r.status === "available").length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center gap-1 px-2 pt-2">
        <Link href="/" aria-label="Back to home" className="flex h-11 w-11 items-center justify-center text-ink">
          <Icon name="arrow-left" size={24} />
        </Link>
        <h1 className="text-[24px] leading-7 font-extrabold tracking-[-0.03em]">{heading}</h1>
      </div>

      <FilterBar filters={filters} areas={areas} />

      {rooms.length === 0 ? (
        <EmptyState filters={filters} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-[18px] pt-4">
            <span className="text-sm text-muted">
              Showing {available} {available === 1 ? "room" : "rooms"}
              {rooms.length > available ? ` · ${rooms.length - available} taken` : ""}
            </span>
            <Suspense>
              <SortSelect value={filters.sort} />
            </Suspense>
          </div>
          <section className="px-[18px] pt-3 pb-8">
            <ListingGrid listings={rooms} />
          </section>
        </>
      )}
    </div>
  );
}

function FilterBar({ filters, areas }: { filters: Filters; areas: AreaSummary[] }) {
  return (
    <div className="border-b-2 border-ink">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-[18px] py-3">
        {filters.area && (
          <Link href={`/rooms${filtersToQuery({ ...filters, area: null })}`} className={chipOn} aria-label={`Remove ${filters.area} filter`}>
            {filters.area}
            <Icon name="x" size={14} />
          </Link>
        )}
        {Object.entries(CAMPUSES).map(([value, label]) => {
          const on = filters.campus === value;
          return (
            <Link
              key={value}
              href={`/rooms${filtersToQuery({ ...filters, area: null, campus: on ? null : (value as Filters["campus"]) })}`}
              aria-current={on ? "true" : undefined}
              className={on ? chipOn : chipOff}
            >
              {label}
            </Link>
          );
        })}
        {filters.type && (
          <Link href={`/rooms${filtersToQuery({ ...filters, type: null })}`} className={chipOn} aria-label={`Remove ${ROOM_TYPES[filters.type]} filter`}>
            {ROOM_TYPES[filters.type]}
            <Icon name="x" size={14} />
          </Link>
        )}
        {filters.max && (
          <Link href={`/rooms${filtersToQuery({ ...filters, max: null })}`} className={chipOn} aria-label="Remove budget filter">
            Up to {formatNaira(filters.max)}
            <Icon name="x" size={14} />
          </Link>
        )}
      </div>

      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-[18px] text-sm font-bold text-brand-700 [&::-webkit-details-marker]:hidden">
          <Icon name="sliders" size={16} />
          <span className="group-open:hidden">Change filters</span>
          <span className="hidden group-open:inline">Close filters</span>
        </summary>
        <div className="px-[18px] pb-4">
          <SearchForm filters={filters} areas={areas} submitLabel="Show rooms" />
        </div>
      </details>
    </div>
  );
}

function EmptyState({ filters }: { filters: Filters }) {
  const nextBudget = filters.max ? BUDGETS.find((b) => b > filters.max!) : undefined;
  return (
    <section className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex h-22 w-22 items-center justify-center rounded-full border-2 border-ink bg-sticker-yellow text-ink">
        <Icon name="search-x" size={40} strokeWidth={1.8} />
      </span>
      <h2 className="text-[24px] leading-7 font-extrabold tracking-[-0.03em]">No rooms match that yet.</h2>
      <p className="max-w-[300px] text-muted">
        Try a wider area or a higher budget. New rooms come in every week. No wahala.
      </p>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
        {nextBudget ? (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, max: nextBudget })}`}
            className="sticker flex h-12 items-center justify-center rounded-md bg-brand-700 font-extrabold text-white"
          >
            Raise budget to {formatNaira(nextBudget)}
          </Link>
        ) : filters.max ? (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, max: null })}`}
            className="sticker flex h-12 items-center justify-center rounded-md bg-brand-700 font-extrabold text-white"
          >
            Show any budget
          </Link>
        ) : null}
        {filters.type && (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, type: null })}`}
            className="sticker flex h-12 items-center justify-center rounded-md bg-white font-extrabold text-ink"
          >
            Show all room types
          </Link>
        )}
        {(filters.campus || filters.area) && (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, campus: null, area: null })}`}
            className="sticker flex h-12 items-center justify-center rounded-md bg-white font-extrabold text-ink"
          >
            Search everywhere
          </Link>
        )}
      </div>
    </section>
  );
}
