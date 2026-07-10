"use client";
import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { reportIssueAction, type IssueState } from "./actions";
import { ISSUE_CATEGORIES } from "@/lib/labels";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Sending…" : "Send to fleet manager"}
    </button>
  );
}

export function ReportIssue() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<IssueState, FormData>(
    reportIssueAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => setOpen(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <section className="card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tap flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-brand" />
          <span className="headline text-lg">Report an issue</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {state.ok ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-good-bg px-3 py-2 text-sm font-semibold text-good-fg">
          <CheckCircle2 className="h-4 w-4" />
          Sent! Your fleet manager will see this.
        </p>
      ) : null}

      {open && !state.ok ? (
        <form action={action} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="category">
              What&apos;s going on?
            </label>
            <select id="category" name="category" required className="field" defaultValue="">
              <option value="" disabled>
                Choose a category…
              </option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="description">
              Describe it
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              className="field py-2"
              placeholder="e.g. Check engine light came on this morning"
            />
          </div>
          <div>
            <label className="label" htmlFor="photo">
              Photo (optional)
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="field py-2 text-sm"
            />
          </div>
          {state.error ? (
            <p className="rounded-lg bg-bad-bg px-3 py-2 text-sm font-semibold text-bad-fg">
              {state.error}
            </p>
          ) : null}
          <SubmitBtn />
        </form>
      ) : null}
    </section>
  );
}
