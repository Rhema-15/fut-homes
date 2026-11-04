import type { Metadata } from "next";
import Link from "next/link";
import { ResetForms } from "../forms";

export const metadata: Metadata = {
  title: "Reset password · FUT Homes",
  robots: { index: false },
};

export default function AgentResetPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-[18px] py-10">
      <h1 className="text-3xl leading-9 font-extrabold text-ink">Forgot password</h1>
      <p className="mt-2 text-base text-muted">FUT Homes sends you a one-time code on WhatsApp. Then you choose a new password.</p>
      <ResetForms />
      <Link href="/agent/login" className="mt-8 block text-center text-sm font-bold text-brand-700 underline">
        Back to log in
      </Link>
    </div>
  );
}
