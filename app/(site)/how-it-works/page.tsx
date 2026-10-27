import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/public/icons";
import { SafetyWarning } from "@/components/public/site-chrome";

export const metadata: Metadata = {
  title: "How it works and safety",
  description: "How FUT Homes works, what we check about listings, and how to stay safe when renting near FUTMINNA.",
};

const STEPS = [
  {
    title: "Search near your campus",
    body: "Pick Bosso or Gidan Kwano, your room type and budget. Every price is the full yearly rent.",
  },
  {
    title: "Watch the room video",
    body: "See the actual room before you spend transport money on a trip.",
  },
  {
    title: "Book an inspection on WhatsApp",
    body: "One tap opens a chat with FUT Homes, with the listing details already typed in.",
  },
  {
    title: "Inspect, then pay",
    body: "Only pay once you've seen the room and you're happy. Get a receipt.",
  },
];

const TIPS = [
  "Make sure the person you meet is the agent on the listing. Ask to see their ID.",
  "Inspect in daylight and take a friend with you.",
  "Ask about every fee in the WhatsApp chat before you go, so nothing new appears on the day.",
  "Check water, light and the toilet during the inspection, not after.",
  "When you pay, get a written receipt with the landlord's or agent's full name.",
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pt-8 pb-12">
      <section className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-[34px] font-extrabold tracking-[-0.01em]">How it works</h1>
        <p className="text-muted">From search to keys in four steps.</p>
        <p className="text-slate">
          FUT Homes is free for students. You deal directly with the agent. We just make sure you know who they are.
        </p>
        <ol className="mt-2 flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-lg border border-line bg-white p-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-700 font-extrabold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="text-lg leading-6 font-semibold">{step.title}</h2>
                <p className="mt-1 text-slate">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="safety" className="flex scroll-mt-20 flex-col gap-3">
        <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">Safety tips</h2>
        <SafetyWarning />
        <ul className="flex flex-col gap-3">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon name="check" size={14} strokeWidth={3} />
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <Link href="/report" className="inline-flex min-h-11 items-center text-sm font-semibold text-error">
          Something feels wrong? Report it
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">What the badges mean</h2>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
          <p>
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 align-middle text-xs leading-4 font-semibold text-brand-700">
              <Icon name="shield-check" size={14} strokeWidth={2.4} />
              Verified home
            </span>
            The agent on this listing has been posting rooms around FUT for a long time, or is still actively posting. Tap any badge to
            see exactly what we checked.
          </p>
          <p>
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-1 align-middle text-xs leading-4 font-semibold text-white">
              <Icon name="shield-check" size={14} strokeWidth={2.4} />
              Verified home
            </span>
            Everything above, plus past students we found ourselves confirmed they rented through this agent.
          </p>
          <p className="text-sm text-muted">A badge shows the listing agent&apos;s track record, not that a deal is safe. Always inspect first.</p>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-lg bg-brand-50 p-4">
        <h2 className="text-lg leading-6 font-semibold">Paying for your child&apos;s room?</h2>
        <p className="text-slate">
          Ask them to send you the listing link. You&apos;ll see the same video, the full yearly price, and exactly
          what we checked about the agent.
        </p>
      </section>

      <Link href="/rooms" className="flex h-12 items-center justify-center rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900">
        See rooms
      </Link>
    </div>
  );
}
