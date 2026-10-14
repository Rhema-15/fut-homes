import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-bg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-[18px] py-2.5">
        <Link href="/" className="flex min-h-11 items-center text-[26px] leading-7 font-extrabold tracking-[-0.04em] text-ink">
          fut homes
        </Link>
        <Link
          href="/for-agents"
          className="flex min-h-10 items-center rounded-full border-2 border-ink bg-white px-3.5 text-sm font-bold text-ink"
        >
          For agents
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-[18px] pt-7 pb-8">
        <span className="text-2xl leading-7 font-extrabold tracking-[-0.04em]">fut homes</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
          <Link href="/how-it-works" className="underline-offset-4 hover:underline">
            How it works
          </Link>
          <Link href="/how-it-works#safety" className="underline-offset-4 hover:underline">
            Safety tips
          </Link>
          <Link href="/for-agents" className="underline-offset-4 hover:underline">
            For agents
          </Link>
          <Link href="/report" className="underline-offset-4 hover:underline">
            Report a problem
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
    <div role="note" className="flex gap-3 rounded-[18px] border-2 border-ink bg-sticker-yellow px-4 py-3.5">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 flex-none text-ink"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
      <div>
        <p className="text-base leading-5 font-extrabold text-ink">Never pay before you inspect.</p>
        <p className="mt-0.5 text-sm font-medium text-ink">
          See the room, meet the agent. FUT Homes will never ask you for money.
        </p>
      </div>
    </div>
  );
}
