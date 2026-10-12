import Link from "next/link";
import { Icon, type IconName } from "@/components/public/icons";
import { ListingGrid } from "@/components/public/listing-card";
import SearchForm from "@/components/public/search-form";
import { SafetyWarning } from "@/components/public/site-chrome";
import { newestListings } from "@/lib/public-data";

export const instant = false;

const PROMISES: { icon: IconName; label: string }[] = [
  { icon: "shield-check", label: "Every agent ID-checked" },
  { icon: "play", label: "Watch the room first" },
  { icon: "message-circle", label: "Book on WhatsApp" },
];

export default async function HomePage() {
  const rooms = await newestListings(6);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="min-[768px]:grid min-[768px]:grid-cols-[1fr_380px] min-[768px]:items-start min-[768px]:gap-8 min-[768px]:px-4 min-[768px]:pt-8">
        <section className="flex flex-col gap-3 px-4 pt-8 pb-6 min-[768px]:px-0 min-[768px]:pt-6">
          <h1 className="text-[32px] leading-[38px] font-extrabold tracking-[-0.01em] min-[768px]:text-[44px] min-[768px]:leading-[52px]">
            Find a room near FUT, from agents we&apos;ve actually checked.
          </h1>
          <p className="text-muted">Real videos. ID-checked agents. Pay only after you inspect.</p>

          <ul className="mt-4 grid grid-cols-3 gap-2">
            {PROMISES.map((p) => (
              <li key={p.label} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon name={p.icon} size={22} />
                </span>
                <span className="text-[13px] leading-[18px] font-semibold">{p.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-4 rounded-lg border border-line bg-white p-4 min-[768px]:mx-0">
          <SearchForm />
        </div>
      </div>

      <section className="flex flex-col gap-4 px-4 pt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">New rooms</h2>
          {rooms.length > 0 && (
            <Link href="/rooms" className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
              See all
            </Link>
          )}
        </div>
        {rooms.length > 0 ? (
          <ListingGrid listings={rooms} />
        ) : (
          <p className="rounded-lg border border-line bg-white p-4 text-muted">
            New rooms are being added this week. Check back soon. No wahala.
          </p>
        )}
      </section>

      <section className="px-4 py-8">
        <SafetyWarning />
      </section>
    </div>
  );
}
