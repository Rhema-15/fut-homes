import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center text-[22px] leading-7 font-extrabold tracking-[-0.02em] text-brand-700"
        >
          fut homes
        </Link>
        <Link
          href="/how-it-works"
          className="flex min-h-11 items-center text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          How it works
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-brand-900 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pt-6 pb-8">
        <span className="text-xl leading-6 font-extrabold tracking-[-0.02em]">fut homes</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/how-it-works" className="underline-offset-4 hover:underline">
            How it works
          </Link>
          <Link href="/how-it-works#safety" className="underline-offset-4 hover:underline">
            Safety tips
          </Link>
        </nav>
        <p className="text-xs leading-4 text-on-dark-muted">
          FUT Homes is independent and not affiliated with the Federal University of Technology, Minna.
        </p>
      </div>
    </footer>
  );
}

export function SafetyWarning() {
  return (
    <div role="note" className="flex gap-3 rounded-md border-[1.5px] border-warning-border bg-warning-50 px-4 py-3">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 flex-none text-warning"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
      <div>
        <p className="font-semibold text-warning">Never pay before you inspect.</p>
        <p className="text-sm text-ink">See the room and meet the agent first. FUT Homes will never ask you for money.</p>
      </div>
    </div>
  );
}
