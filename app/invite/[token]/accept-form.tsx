"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acceptInviteAction, type InviteState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Setting up…" : "Set password & sign in"}
    </button>
  );
}

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState<InviteState, FormData>(
    acceptInviteAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="field"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="field"
        />
      </div>
      {state.error ? (
        <p className="rounded-lg bg-bad-bg px-3 py-2 text-sm font-semibold text-bad-fg">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
