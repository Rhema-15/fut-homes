"use client";

// Shown instead of a crash if loading rooms fails (database down,
// slow network, or a setup step missed).
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-[22px] leading-7 font-extrabold">We couldn&apos;t load rooms right now.</h1>
      <p className="text-muted">Check your connection and try again. No wahala.</p>
      <button
        type="button"
        onClick={reset}
        className="flex h-12 w-full items-center justify-center rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900"
      >
        Try again
      </button>
    </section>
  );
}
