"use client";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import { submitMileageAction, type MileageState } from "./actions";
import { StatusBadge } from "@/components/status-badge";
import { formatMiles } from "@/lib/utils";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full text-lg" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function MileageWidget({
  submittedThisWeek,
  referenceOdo,
  deadlineLabel,
}: {
  submittedThisWeek: number | null;
  referenceOdo: number | null;
  deadlineLabel: string;
}) {
  const [state, action] = useActionState<MileageState, FormData>(
    submitMileageAction,
    {},
  );
  const [editing, setEditing] = useState(submittedThisWeek == null);
  const [forceEdit, setForceEdit] = useState(false);
  const [odo, setOdo] = useState(
    submittedThisWeek != null ? String(submittedThisWeek) : "",
  );

  // On successful save, collapse back to the "submitted" summary.
  useEffect(() => {
    if (state.ok) {
      setEditing(false);
      setForceEdit(false);
    }
  }, [state.ok]);

  const effectiveSubmitted = state.ok ? state.odometer ?? null : submittedThisWeek;
  const showConfirm = state.needsConfirm && !forceEdit;

  // Summary view: reading is in for the week.
  if (effectiveSubmitted != null && !editing) {
    return (
      <section className="card border-2 border-good/30 p-5">
        <div className="mb-3 flex items-center justify-between">
          <StatusBadge tone="good">
            <CheckCircle2 className="h-4 w-4" />
            Submitted for this week
          </StatusBadge>
        </div>
        <p className="text-sm text-slate-500">This week&apos;s odometer</p>
        <p className="text-4xl font-extrabold text-ink">
          {formatMiles(effectiveSubmitted)}{" "}
          <span className="text-lg font-semibold text-slate-400">mi</span>
        </p>
        <button
          onClick={() => {
            setOdo(String(effectiveSubmitted));
            setEditing(true);
          }}
          className="btn-ghost mt-4 w-full"
        >
          <Pencil className="h-4 w-4" />
          Update reading
        </button>
      </section>
    );
  }

  // Entry view.
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge tone="warn">
          <AlertTriangle className="h-4 w-4" />
          Due — enter by {deadlineLabel}
        </StatusBadge>
      </div>

      <form action={action}>
        <label htmlFor="odometer" className="mb-2 block text-center text-sm font-semibold text-slate-600">
          Enter this week&apos;s odometer
        </label>
        <input
          id="odometer"
          name="odometer"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          value={odo}
          onChange={(e) => setOdo(e.target.value)}
          className="odometer-input"
          placeholder="0"
          autoFocus
        />

        {referenceOdo != null ? (
          <p className="mt-2 text-center text-sm text-slate-500">
            Last recorded: <span className="font-bold">{formatMiles(referenceOdo)} mi</span>
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-slate-500">
            First reading for this vehicle.
          </p>
        )}

        {state.error ? (
          <p className="mt-3 rounded-lg bg-bad-bg px-3 py-2 text-center text-sm font-semibold text-bad-fg">
            {state.error}
          </p>
        ) : null}

        {showConfirm ? (
          <div className="mt-4 rounded-xl border-2 border-warn/40 bg-warn-bg p-4">
            <p className="text-center font-bold text-warn-fg">
              That&apos;s {formatMiles(state.jump ?? 0)} miles since last week — is
              that right?
            </p>
            <div className="mt-3 space-y-2">
              <input type="hidden" name="confirmed" value="true" />
              <SubmitBtn label="Yes, that's right" />
              <button
                type="button"
                onClick={() => setForceEdit(true)}
                className="btn-ghost w-full"
              >
                Let me fix it
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <SubmitBtn label="Submit reading" />
          </div>
        )}
      </form>
    </section>
  );
}
