import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/public/icons";
import { ListingGrid } from "@/components/public/listing-card";
import SearchForm from "@/components/public/search-form";
import SortSelect from "@/components/public/sort-select";
import { SafetyWarning } from "@/components/public/site-chrome";
import { FUT_HOMES_WHATSAPP, whatsappLink } from "@/lib/contact";
import { CAMPUSES, ROOM_TYPES, formatNaira } from "@/lib/options";
import { type AreaSummary, BUDGETS, type Filters, filtersToQuery, listAreas, readFilters, searchListings } from "@/lib/public-data";

export const instant = false;

export async function generateMetadata({ searchParams }: PageProps<"/rooms">): Promise<Metadata> {
  const f = readFilters(await searchParams);
  return { title: f.area ? `Rooms in ${f.area}` : f.campus ? `Rooms near ${CAMPUSES[f.campus]}` : "Rooms near FUTMINNA" };
}

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
      <h1 className="sr-only">{heading}</h1>
      <SearchSummary filters={filters} areas={areas} />

      {rooms.length === 0 ? (
        <EmptyState filters={filters} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-[18px] pt-4">
            <span className="text-[15px] font-extrabold">
              {available} {available === 1 ? "room" : "rooms"}
              {rooms.length > available && (
                <span className="font-medium text-muted"> · {rooms.length - available} just taken</span>
              )}
            </span>
            <Suspense>
              <SortSelect value={filters.sort} />
            </Suspense>
          </div>
          <section className="px-[18px] pt-3.5">
            <ListingGrid listings={rooms} large />
          </section>
        </>
      )}

      <section className="flex flex-col gap-4 px-[18px] pt-7 pb-8 min-[700px]:max-w-xl">
        <CantFind filters={filters} />
        <SafetyWarning />
      </section>
    </div>
  );
}

// What you searched, pinned under the header while you scroll. Tap to
// open the search form right there.
function SearchSummary({ filters, areas }: { filters: Filters; areas: AreaSummary[] }) {
  const where = filters.area ?? (filters.campus ? `Near ${CAMPUSES[filters.campus]}` : "Anywhere near FUT");
  const details = [
    filters.type ? ROOM_TYPES[filters.type] : "Any room type",
    filters.max ? `up to ${formatNaira(filters.max)}` : "any budget",
  ].join(" · ");
  return (
    <details className="group sticky top-[66px] z-10 border-b-2 border-ink bg-bg open:static">
      <summary className="cursor-pointer list-none px-[18px] py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="sticker flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-1.5 pl-3.5">
          <Icon name="search" size={18} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] leading-[18px] font-extrabold">{where}</span>
            <span className="truncate text-xs leading-4 font-semibold text-muted">{details}</span>
          </span>
          <span className="flex h-[34px] flex-none items-center rounded-full bg-brand-700 px-3.5 text-sm font-extrabold text-white">
            <span className="group-open:hidden">Edit</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </span>
      </summary>
      <div className="px-[18px] pt-1 pb-4">
        <SearchForm filters={filters} areas={areas} submitLabel="Show rooms" />
      </div>
    </details>
  );
}

// Nothing fits? Students tell Rhema what they want; he asks the agents.
function CantFind({ filters }: { filters: Filters }) {
  const want = [
    filters.type ? ROOM_TYPES[filters.type] : "a room",
    filters.area ? `in ${filters.area}` : filters.campus ? `near ${CAMPUSES[filters.campus]}` : "near FUT",
    filters.max ? `up to ${formatNaira(filters.max)}/year` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const message = `Hi FUT Homes, I'm looking for ${want}. Please message me when one comes up.`;
  return (
    <div className="sticker flex flex-col gap-1.5 rounded-[22px] bg-sticker-mint p-[18px]">
      <h2 className="text-[20px] leading-6 font-extrabold tracking-[-0.02em]">Can&apos;t find your room?</h2>
      <p className="text-sm leading-5 font-medium">
        Tell us the area, room type and budget. We&apos;ll ask our agents and message you when one comes up.
      </p>
      <a
        href={whatsappLink(FUT_HOMES_WHATSAPP, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex h-12 items-center justify-center gap-2 rounded-md border-2 border-ink bg-whatsapp font-extrabold text-white"
      >
        <Icon name="message-circle" size={18} />
        Tell us on WhatsApp
      </a>
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
