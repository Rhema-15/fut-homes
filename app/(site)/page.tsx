import Link from "next/link";
import { connection } from "next/server";
import { ListingGrid } from "@/components/public/listing-card";
import SearchForm from "@/components/public/search-form";
import { SafetyWarning } from "@/components/public/site-chrome";
import { formatNaira, formatNairaShort, photoUrl } from "@/lib/options";
import { type AreaSummary, listAreas, newestListings } from "@/lib/public-data";

export const instant = false;

const RINGS = ["bg-brand-700", "bg-sticker-pink", "bg-sticker-yellow", "bg-sticker-mint"];

export default async function HomePage() {
  // Render per request (must happen outside the catches below).
  await connection();
  // If rooms can't load, still show the page.
  const [rooms, areas] = await Promise.all([
    newestListings(6).catch((e) => {
      console.error(e);
      return [];
    }),
    listAreas().catch((e) => {
      console.error(e);
      return [] as AreaSummary[];
    }),
  ]);
  const newestCover = rooms[0]?.photos[0] ?? null;
  const roommateCover = rooms.find((r) => r.room_type === "shared")?.photos[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="min-[820px]:grid min-[820px]:grid-cols-[1fr_400px] min-[820px]:items-start min-[820px]:gap-10 min-[820px]:px-[18px] min-[820px]:pt-10">
        <section className="px-[18px] pt-5 min-[820px]:px-0 min-[820px]:pt-6">
          <h1 className="text-[34px] leading-[36px] font-extrabold tracking-[-0.035em] min-[820px]:text-[56px] min-[820px]:leading-[56px]">
            Find your room near FUT.
          </h1>
          <p className="mt-2 text-base leading-[22px] font-medium text-muted min-[820px]:text-lg">
            Rooms from verified agents around Bosso and Gidan Kwano. Inspect before you pay.
          </p>
        </section>

        <div className="sticker mx-[18px] mt-4 rounded-[22px] bg-white p-3.5 shadow-sticker min-[820px]:mx-0 min-[820px]:mt-0">
          <SearchForm areas={areas} />
        </div>
      </div>

      <section className="pt-6" aria-labelledby="browse-title">
        <h2 id="browse-title" className="px-[18px] text-[15px] font-extrabold">
          Browse
        </h2>
        <ul className="no-scrollbar flex gap-3.5 overflow-x-auto px-[18px] pt-2.5 pb-1">
          <BrowseCircle href="/rooms?sort=new" label="New today" photo={newestCover} ring={RINGS[0]} />
          {areas.slice(0, 8).map((a, i) => (
            <BrowseCircle
              key={a.area}
              href={`/rooms?where=${encodeURIComponent(`area:${a.area}`)}`}
              label={a.area}
              photo={a.cover}
              ring={RINGS[(i + 1) % RINGS.length]}
            />
          ))}
          <BrowseCircle href="/rooms?where=bosso" label="Near Bosso" photo={null} ring={RINGS[2]} text="Bosso" />
          <BrowseCircle href="/rooms?where=gidan_kwano" label="Near GK" photo={null} ring={RINGS[1]} text="GK" />
          {roommateCover && (
            <BrowseCircle href="/rooms?type=shared" label="Roommates" photo={roommateCover} ring={RINGS[3]} />
          )}
          <BrowseCircle href="/rooms?max=250000" label="Under" photo={null} ring="" text={formatNaira(250000).replace(",000", "k")} dashed />
        </ul>
      </section>

      <section className="flex flex-col gap-3 px-[18px] pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[22px] leading-[26px] font-extrabold tracking-[-0.03em]">Fresh this week</h2>
          {rooms.length > 0 && (
            <Link href="/rooms" className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline">
              See all
            </Link>
          )}
        </div>
        {rooms.length > 0 ? (
          <ListingGrid listings={rooms.slice(0, 4)} />
        ) : (
          <p className="sticker rounded-lg bg-white p-4 font-medium text-muted">
            New rooms are being added this week. Check back soon. No wahala.
          </p>
        )}
      </section>

      {areas.length > 0 && (
        <section className="flex flex-col gap-2.5 px-[18px] pt-7" aria-labelledby="areas-title">
          <h2 id="areas-title" className="text-[22px] leading-[26px] font-extrabold tracking-[-0.03em]">
            Rooms by area
          </h2>
          <ul className="grid grid-cols-2 gap-2.5 min-[700px]:grid-cols-3">
            {areas.slice(0, 6).map((a) => (
              <li key={a.area}>
                <Link
                  href={`/rooms?where=${encodeURIComponent(`area:${a.area}`)}`}
                  className="flex h-full flex-col gap-0.5 rounded-[16px] border-2 border-ink bg-white px-3.5 py-3 text-ink"
                >
                  <span className="truncate text-[17px] leading-[22px] font-extrabold">{a.area}</span>
                  <span className="text-[13px] leading-[17px] font-semibold text-muted">
                    {a.count} {a.count === 1 ? "room" : "rooms"} · {a.count === 1 ? "" : "from "}
                    {formatNairaShort(a.minPrice)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2.5 px-[18px] pt-7" aria-labelledby="how-title">
        <div className="flex items-baseline justify-between">
          <h2 id="how-title" className="text-[22px] leading-[26px] font-extrabold tracking-[-0.03em]">
            How it works
          </h2>
          <Link href="/how-it-works" className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline">
            More
          </Link>
        </div>
        <ol className="grid grid-cols-3 gap-2">
          {[
            { bg: "bg-sticker-yellow", text: "Search near your campus" },
            { bg: "bg-sticker-pink", text: "Watch the room video" },
            { bg: "bg-sticker-mint", text: "Book on WhatsApp, inspect, then pay" },
          ].map((step, i) => (
            <li key={step.text} className={"flex flex-col gap-1.5 rounded-[16px] border-2 border-ink p-3 " + step.bg}>
              <span className="text-[22px] leading-6 font-extrabold">{i + 1}</span>
              <span className="text-sm leading-[18px] font-bold">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4 px-[18px] pt-7 pb-8">
        <SafetyWarning />
        <div className="flex items-center gap-3 rounded-[18px] border-2 border-ink bg-brand-700 p-4 text-white">
          <span className="flex-1 text-[17px] leading-[21px] font-extrabold">Got rooms near FUT? List them free.</span>
          <Link
            href="/for-agents"
            className="flex-none rounded-[12px] border-2 border-ink bg-white px-3.5 py-2.5 text-sm font-extrabold text-ink"
          >
            For agents
          </Link>
        </div>
      </section>
    </div>
  );
}

function BrowseCircle({
  href,
  label,
  photo,
  ring,
  text,
  dashed = false,
}: {
  href: string;
  label: string;
  photo: string | null;
  ring: string;
  text?: string;
  dashed?: boolean;
}) {
  return (
    <li className="flex-none">
      <Link href={href} className="flex w-[68px] flex-col items-center gap-1.5 text-ink">
        {dashed ? (
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-ink text-[15px] font-extrabold">
            {text}
          </span>
        ) : (
          <span className={"flex h-16 w-16 rounded-full p-[3px] " + ring}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl(photo)}
                alt=""
                loading="lazy"
                className="h-full w-full rounded-full border-[3px] border-bg object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-bg bg-white text-[13px] font-extrabold">
                {text}
              </span>
            )}
          </span>
        )}
        <span className="w-full truncate text-center text-xs leading-[14px] font-bold">{label}</span>
      </Link>
    </li>
  );
}
