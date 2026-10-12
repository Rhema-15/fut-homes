import type { Metadata } from "next";
import { Suspense } from "react";
import ReportForm from "@/components/public/report-form";

export const metadata: Metadata = {
  title: "Report a problem",
  robots: { index: false },
};

export default function ReportPage({ searchParams }: PageProps<"/report">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-8 pb-12">
      <h1 className="text-[28px] leading-[34px] font-extrabold tracking-[-0.01em]">Report a problem</h1>
      <p className="text-slate">
        Tell us what happened. Reports are private: the agent won&apos;t see your name.
      </p>
      <Suspense>
        <ReportFormFromParams searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReportFormFromParams({ searchParams }: { searchParams: PageProps<"/report">["searchParams"] }) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 80) : "");
  return <ReportForm listing={one(params.listing)} agent={one(params.agent)} />;
}
