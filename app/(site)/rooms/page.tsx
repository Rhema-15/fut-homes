import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/public/icons";
import { ListingGrid } from "@/components/public/listing-card";
import SearchForm from "@/components/public/search-form";
import SortSelect from "@/components/public/sort-select";
import { CAMPUSES, ROOM_TYPES, formatNaira } from "@/lib/options";
import { BUDGETS, type Filters, filtersToQuery, readFilters, searchListings } from "@/lib/public-data";

export const instant = false;

export async function generateMetadata({ searchParams }: PageProps<"/rooms">): Promise<Metadata> {
  const f = readFilters(await searchParams);
  return { title: f.campus ? `Rooms near ${CAMPUSES[f.campus]}` : "Rooms near FUTMINNA" };
}

const chipOn =
  "inline-flex h-9 flex-none items-center gap-1.5 rounded-sm border-[1.5px] border-brand-700 bg-brand-50 px-3 text-sm font-semibold text-brand-700";
const chipOff =
  "inline-flex h-9 flex-none items-center gap-1.5 rounded-sm border border-control-border bg-white px-3 text-sm font-semibold text-ink";

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const filters = readFilters(await searchParams);
  const rooms = await searchListings(filters);
  const heading = filters.campus ? `Rooms near ${CAMPUSES[filters.campus]}` : "All rooms";
  const available = rooms.filter((r) => r.status === "available").length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center gap-1 border-b border-line bg-white px-2 py-1">
        <Link href="/" aria-label="Back to home" className="flex h-11 w-11 items-center justify-center text-ink">
          <Icon name="arrow-left" size={24} />
        </Link>
        <h1 className="text-lg leading-6 font-semibold">{heading}</h1>
      </div>

      <FilterBar filters={filters} />

      {rooms.length === 0 ? (
        <EmptyState filters={filters} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <span className="text-sm text-muted">
              Showing {available} {available === 1 ? "room" : "rooms"}
              {rooms.length > available ? ` · ${rooms.length - available} taken` : ""}
            </span>
            <Suspense>
              <SortSelect value={filters.sort} />
            </Suspense>
          </div>
          <section className="p-4">
            <ListingGrid listings={rooms} />
          </section>
        </>
      )}
    </div>
  );
}

function FilterBar({ filters }: { filters: Filters }) {
  return (
    <div className="border-b border-line bg-white">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {Object.entries(CAMPUSES).map(([value, label]) => {
          const on = filters.campus === value;
          return (
            <Link
              key={value}
              href={`/rooms${filtersToQuery({ ...filters, campus: on ? null : (value as Filters["campus"]) })}`}
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

      <details className="group border-t border-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-brand-700 [&::-webkit-details-marker]:hidden">
          <Icon name="sliders" size={16} />
          <span className="group-open:hidden">Change filters</span>
          <span className="hidden group-open:inline">Close filters</span>
        </summary>
        <div className="px-4 pb-4">
          <SearchForm filters={filters} submitLabel="Show rooms" />
        </div>
      </details>
    </div>
  );
}

function EmptyState({ filters }: { filters: Filters }) {
  const nextBudget = filters.max ? BUDGETS.find((b) => b > filters.max!) : undefined;
  return (
    <section className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex h-22 w-22 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon name="search-x" size={40} strokeWidth={1.8} />
      </span>
      <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">No rooms match that yet.</h2>
      <p className="max-w-[300px] text-muted">
        Try a wider area or a higher budget. New rooms come in every week. No wahala.
      </p>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
        {nextBudget ? (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, max: nextBudget })}`}
            className="flex h-12 items-center justify-center rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900"
          >
            Raise budget to {formatNaira(nextBudget)}
          </Link>
        ) : filters.max ? (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, max: null })}`}
            className="flex h-12 items-center justify-center rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900"
          >
            Show any budget
          </Link>
        ) : null}
        {filters.type && (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, type: null })}`}
            className="flex h-12 items-center justify-center rounded-md bg-white font-semibold text-brand-700 shadow-[inset_0_0_0_1.5px_var(--color-brand-700)] active:bg-brand-50"
          >
            Show all room types
          </Link>
        )}
        {filters.campus && (
          <Link
            href={`/rooms${filtersToQuery({ ...filters, campus: null })}`}
            className="flex h-12 items-center justify-center rounded-md bg-white font-semibold text-brand-700 shadow-[inset_0_0_0_1.5px_var(--color-brand-700)] active:bg-brand-50"
          >
            Search both campuses
          </Link>
        )}
      </div>
    </section>
  );
}
