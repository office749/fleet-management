"use client";
import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus, Copy, Check } from "lucide-react";
import { addMemberAction, type AddMemberState } from "./actions";

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending}>
      <UserPlus className="h-4 w-4" /> {pending ? "Adding…" : "Add team member"}
    </button>
  );
}

export function AddMemberForm() {
  const [state, action] = useActionState<AddMemberState, FormData>(addMemberAction, {});
  const [mode, setMode] = useState<"password" | "invite">("password");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !state.inviteUrl) formRef.current?.reset();
    if (state.ok) setCopied(false);
  }, [state.ok, state.inviteUrl]);

  return (
    <div>
      <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">Full name *</label>
          <input id="fullName" name="fullName" required className="field" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className="field"
            autoCapitalize="none" placeholder="jane@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" className="field" placeholder="(801) 555-0123" />
        </div>
        <div>
          <label className="label" htmlFor="role">Role</label>
          <select id="role" name="role" className="field" defaultValue="driver">
            <option value="driver">Driver</option>
            <option value="admin">Admin (office staff)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">How will they sign in?</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`tap flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 ${mode === "password" ? "border-brand bg-brand-50" : "border-slate-200"}`}>
              <input type="radio" name="mode" value="password" checked={mode === "password"}
                onChange={() => setMode("password")} />
              <span className="text-sm font-semibold">I&apos;ll set a password now</span>
            </label>
            <label className={`tap flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 ${mode === "invite" ? "border-brand bg-brand-50" : "border-slate-200"}`}>
              <input type="radio" name="mode" value="invite" checked={mode === "invite"}
                onChange={() => setMode("invite")} />
              <span className="text-sm font-semibold">Send an invite link</span>
            </label>
          </div>
        </div>

        {mode === "password" ? (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="password">Temporary password *</label>
            <input id="password" name="password" className="field"
              placeholder="At least 8 characters — you'll hand this to them" />
            <p className="mt-1 text-xs text-slate-500">
              Good for drivers who don&apos;t use email. Give them this password directly.
            </p>
          </div>
        ) : (
          <p className="sm:col-span-2 text-sm text-slate-500">
            We&apos;ll generate a private link. Copy it and text/email it to them; they set
            their own password.
          </p>
        )}

        {state.error ? (
          <p className="sm:col-span-2 rounded-lg bg-bad-bg px-3 py-2 text-sm font-semibold text-bad-fg">
            {state.error}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <SaveBtn />
        </div>
      </form>

      {state.ok && !state.inviteUrl ? (
        <p className="mt-3 rounded-lg bg-good-bg px-3 py-2 text-sm font-semibold text-good-fg">
          Team member added. They can sign in with the password you set.
        </p>
      ) : null}

      {state.ok && state.inviteUrl ? (
        <div className="mt-3 rounded-lg border-2 border-good/40 bg-good-bg p-3">
          <p className="text-sm font-semibold text-good-fg">
            Invite created! Send this private link to the new member:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={state.inviteUrl}
              className="field h-10 flex-1 bg-white py-0 text-sm" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn-secondary px-3"
              onClick={() => {
                navigator.clipboard?.writeText(state.inviteUrl!);
                setCopied(true);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-good-fg">This link expires in 14 days.</p>
        </div>
      ) : null}
    </div>
  );
}
