"use client";

import { useActionState } from "react";
import { makeResetCode, setAgentPassword, type LoginState } from "./actions";

const initial: LoginState = { error: null };

function Result({ state }: { state: LoginState }) {
  return (
    <>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.note && <p className="text-sm text-green-800">{state.note}</p>}
      {state.wa && (
        <a href={state.wa} className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white">
          Send on WhatsApp
        </a>
      )}
    </>
  );
}

export function SetPasswordForm({ agentId, name, phone, hasLogin }: { agentId: string; name: string; phone: string; hasLogin: boolean }) {
  const [state, action, pending] = useActionState(setAgentPassword.bind(null, agentId, name, phone), initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        name="password"
        placeholder={hasLogin ? "New password" : "Choose a password"}
        autoComplete="off"
        className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base"
      />
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
        {hasLogin ? "Reset password" : "Create login"}
      </button>
      <div className="flex basis-full flex-wrap items-center gap-3">
        <Result state={state} />
      </div>
    </form>
  );
}

export function ResetCodeForm({ requestId, name, phone }: { requestId: string; name: string; phone: string }) {
  const [state, action, pending] = useActionState(makeResetCode.bind(null, requestId, name, phone), initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
        Make a reset code
      </button>
      <Result state={state} />
    </form>
  );
}
