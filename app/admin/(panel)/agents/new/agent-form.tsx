"use client";

import { useActionState, useState } from "react";
import PhotoUpload from "@/components/photo-upload";
import { VERIFICATION_LEVELS } from "@/lib/options";
import type { FormState } from "@/lib/form-utils";
import { createAgent } from "../actions";

const initialState: FormState = { error: null };
const input = "rounded-md border border-neutral-300 px-3 py-2 text-base";

export default function AgentForm() {
  const [state, formAction, pending] = useActionState(createAgent, initialState);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Full name
        <input name="name" required className={input} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        WhatsApp number
        <input name="whatsapp" type="tel" inputMode="tel" placeholder="0803 123 4567" required className={input} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Verification level
        <select name="verification_level" defaultValue="id_verified" className={input}>
          {Object.entries(VERIFICATION_LEVELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <PhotoUpload
        name="photo"
        folder="agents"
        max={1}
        label="Profile photo (optional)"
        hint="A clear face photo helps students trust the agent."
        onBusyChange={setUploading}
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
        {uploading ? "Waiting for photo…" : pending ? "Saving…" : "Save agent"}
      </button>
    </form>
  );
}
