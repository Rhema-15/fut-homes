"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword, finishReset, loginAgent, requestReset, type FormState } from "./actions";

const initial: FormState = { error: null, ok: null };
const input = "rounded-md border-2 border-ink bg-white px-3 py-3 text-base text-ink";
const button = "sticker rounded-md bg-brand-700 px-4 py-3 text-base font-extrabold text-white disabled:opacity-60";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAgent, initial);
  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        WhatsApp number
        <input name="phone" type="tel" inputMode="tel" autoComplete="username" required placeholder="0803 123 4567" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-error-50 p-3 text-sm font-bold text-error">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="sticker rounded-md bg-brand-700 px-4 py-3 text-base font-extrabold text-white disabled:opacity-60">
        {pending ? "Logging in…" : "Log in"}
      </button>
      <Link href="/agent/reset" className="text-center text-sm font-bold text-brand-700 underline">
        Forgot your password?
      </Link>
    </form>
  );
}

function Message({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-md bg-error-50 p-3 text-sm font-bold text-error">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-md bg-success-50 p-3 text-sm font-bold text-success">
        {state.ok}
      </p>
    );
  return null;
}

export function ResetForms() {
  const [askState, ask, asking] = useActionState(requestReset, initial);
  const [doState, doReset, resetting] = useActionState(finishReset, initial);
  return (
    <div className="mt-6 flex flex-col gap-8">
      <form action={ask} className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold text-ink">1. Ask for a code</h2>
        <label className="flex flex-col gap-1 text-sm font-bold text-ink">
          WhatsApp number
          <input name="phone" type="tel" inputMode="tel" required placeholder="0803 123 4567" className={input} />
        </label>
        <Message state={askState} />
        <button type="submit" disabled={asking} className={button}>
          {asking ? "Sending…" : "Ask FUT Homes for a code"}
        </button>
      </form>
      <form action={doReset} className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold text-ink">2. I have a code</h2>
        <label className="flex flex-col gap-1 text-sm font-bold text-ink">
          WhatsApp number
          <input name="phone" type="tel" inputMode="tel" required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-ink">
          Code from FUT Homes (works for 10 minutes)
          <input name="code" inputMode="numeric" autoComplete="one-time-code" required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-ink">
          New password (6 or more characters)
          <input name="next" type="password" autoComplete="new-password" required minLength={6} className={input} />
        </label>
        <Message state={doState} />
        <button type="submit" disabled={resetting} className={button}>
          {resetting ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initial);
  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        Current password
        <input name="old" type="password" autoComplete="current-password" required className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        New password (6 or more characters)
        <input name="next" type="password" autoComplete="new-password" required minLength={6} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        New password again
        <input name="again" type="password" autoComplete="new-password" required minLength={6} className={input} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-error-50 p-3 text-sm font-bold text-error">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-md bg-success-50 p-3 text-sm font-bold text-success">
          {state.ok}
        </p>
      )}
      <button type="submit" disabled={pending} className="sticker rounded-md bg-white px-4 py-3 text-base font-extrabold text-ink disabled:opacity-60">
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
