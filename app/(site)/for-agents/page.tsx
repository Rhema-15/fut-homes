import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/public/icons";
import { FUT_HOMES_WHATSAPP, whatsappLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "For agents",
  description: "List your rooms where FUTMINNA students actually look. ID verified from day one, free at launch.",
};

const REASONS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "play",
    title: "Serious enquiries",
    body: "Students have already watched the video before they message you.",
  },
  {
    icon: "shield-check",
    title: "A badge students trust",
    body: "ID verified from day one. Earn Trusted agent when past students confirm they rented through you.",
  },
  {
    icon: "map-pin",
    title: "Only FUT students",
    body: "Rooms near Bosso and Gidan Kwano, shown to the people looking for them.",
  },
];

const STEPS = [
  "Message us on WhatsApp with your full name (as on your ID), the areas you cover, and a clear photo of your ID.",
  "We check it and reply on WhatsApp.",
  "For each room, send a photo of the building from outside, a video of the room, and the price. We post it with your ID verified badge.",
];

const MESSAGE = `Hi FUT Homes, I'm an agent and I'd like to list my rooms.
Full name (as on my ID):
Areas I cover:
I'll send a photo of my ID next.
I will never ask a student to pay before they have inspected the room.`;

export default function ForAgentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pt-8 pb-12">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-brand-700">For agents</p>
        <h1 className="text-[28px] leading-[34px] font-extrabold tracking-[-0.01em]">
          List your rooms where FUT students actually look.
        </h1>
        <p className="text-slate">
          Students watch your room video, see that you&apos;re ID-checked, and message you on WhatsApp ready to
          inspect.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">Why list here</h2>
        <ul className="flex flex-col gap-3">
          {REASONS.map((r) => (
            <li key={r.title} className="flex gap-3 rounded-lg border border-line bg-white p-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon name={r.icon} size={22} />
              </span>
              <div>
                <h3 className="text-lg leading-6 font-semibold">{r.title}</h3>
                <p className="mt-1 text-slate">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="rounded-md bg-brand-50 p-3 font-semibold text-brand-700">Cost: free at launch.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">How you get verified</h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-700 font-extrabold text-white">
                {i + 1}
              </span>
              <p className="pt-1.5">{step}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">Your ID is only used to verify you. It&apos;s never shown to students.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
        <p className="font-semibold">Our one rule</p>
        <p className="text-slate">I will never ask a student to pay before they have inspected the room.</p>
        <a
          href={whatsappLink(FUT_HOMES_WHATSAPP, MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex h-[52px] items-center justify-center gap-2 rounded-md bg-whatsapp px-4 font-semibold text-white active:bg-whatsapp-pressed"
        >
          <Icon name="message-circle" size={20} />
          Message us on WhatsApp to list
        </a>
      </section>
    </div>
  );
}
