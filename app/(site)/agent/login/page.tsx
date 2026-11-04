import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortal } from "@/lib/agent-portal";
import { LoginForm } from "../forms";

export const dynamic = "force-dynamic";

export const instant = false;

export const metadata: Metadata = {
  title: "Agent login · FUT Homes",
  robots: { index: false },
};

export default async function AgentLoginPage({ searchParams }: PageProps<"/agent/login">) {
  if (await getPortal()) redirect("/agent");
  const reset = (await searchParams).reset === "1";
  return (
    <div className="mx-auto w-full max-w-sm px-[18px] py-10">
      <h1 className="text-3xl leading-9 font-extrabold text-ink">Agent login</h1>
      <p className="mt-2 text-base text-muted">See the rooms you gave FUT Homes and tell us which ones are still available.</p>
      {reset && (
        <p role="status" className="mt-4 rounded-md bg-success-50 p-3 text-sm font-bold text-success">
          Password changed. Log in with your new password.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
