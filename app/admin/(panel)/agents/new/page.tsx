import type { Metadata } from "next";
import AgentForm from "../agent-form";
import { createAgent } from "../actions";

export const metadata: Metadata = { title: "Add agent · FUT Homes admin", robots: { index: false } };

export default function NewAgentPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Add agent</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Only add agents whose ID you&apos;ve checked. Don&apos;t upload their ID here.
      </p>
      <AgentForm action={createAgent} />
    </div>
  );
}
