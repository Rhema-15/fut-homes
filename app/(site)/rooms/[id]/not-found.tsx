import Link from "next/link";

export default function ListingNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-[22px] leading-7 font-extrabold">This room isn&apos;t on FUT Homes anymore.</h1>
      <p className="text-muted">It may have been taken or removed. Here are the rooms that are still open.</p>
      <Link href="/rooms" className="flex h-12 w-full items-center justify-center rounded-md bg-brand-700 font-semibold text-white">
        See available rooms
      </Link>
    </section>
  );
}
