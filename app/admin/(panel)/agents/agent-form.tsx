"use client";

import { useActionState, useState } from "react";
import PhotoUpload from "@/components/photo-upload";
import type { FormState } from "@/lib/form-utils";

const initialState: FormState = { error: null };
const input = "rounded-md border border-neutral-300 px-3 py-2 text-base";

export type AgentDefaults = { name: string; whatsapp: string; is_trusted: boolean; photo_path: string | null };

export default function AgentForm({
  action,
  agent,
  submitLabel = "Save agent",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  agent?: AgentDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Full name
        <input name="name" required defaultValue={agent?.name} className={input} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        WhatsApp number
        <input name="whatsapp" defaultValue={agent?.whatsapp} type="tel" inputMode="tel" placeholder="0803 123 4567" required className={input} />
      </label>

      <label className="flex items-start gap-3 rounded-md border border-neutral-300 p-3 text-sm">
        <input name="is_trusted" type="checkbox" defaultChecked={agent?.is_trusted} className="mt-1 h-4 w-4" />
        <span>
          <span className="font-medium">Trusted agent</span>
          <span className="block text-neutral-500">
            Tick only if past students you found yourself confirmed they rented through this agent. Every agent is
            &ldquo;ID verified&rdquo; by default.
          </span>
        </span>
      </label>

      <PhotoUpload
        name="photo"
        folder="agents"
        max={1}
        label="Profile photo (optional)"
        hint="A clear face photo helps students trust the agent."
        onBusyChange={setUploading}
        initialPaths={agent?.photo_path ? [agent.photo_path] : []}
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {uploading ? "Waiting for photo…" : pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
