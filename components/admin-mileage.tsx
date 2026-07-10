"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  setWeekMileageAction,
  editMileageAction,
  type MileageEntryState,
} from "@/app/(admin)/vehicles/actions";
import { formatMiles } from "@/lib/utils";
import { dateLabel } from "@/lib/expiry";

type Reading = {
  id: string;
  odometer: number;
  weekStart: Date;
  enteredBy: string;
  needsReview: boolean;
};

function Btn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function AdminMileage({
  vehicleId,
  weekLabel,
  thisWeekValue,
  recent,
}: {
  vehicleId: string;
  weekLabel: string;
  thisWeekValue: number | null;
  recent: Reading[];
}) {
  const [state, action] = useActionState<MileageEntryState, FormData>(
    setWeekMileageAction,
    {},
  );

  return (
    <section className="card p-4">
      <h2 className="headline mb-1 text-lg">Weekly mileage</h2>
      <p className="mb-3 text-sm text-slate-500">
        Drivers enter this on their phone. You can also record or correct it here.
      </p>

      {/* This week's entry */}
      <form action={action} className="mb-4 rounded-xl bg-slate-50 p-3">
        <label className="label" htmlFor="odometer">
          This week ({weekLabel})
        </label>
        <div className="flex items-center gap-2">
          <input
            id="odometer"
            name="odometer"
            type="number"
            inputMode="numeric"
            defaultValue={thisWeekValue ?? ""}
            placeholder="Odometer"
            className="field h-11 flex-1 py-0"
          />
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <Btn label={thisWeekValue != null ? "Update" : "Save"} />
        </div>
        {state.error ? (
          <p className="mt-2 rounded-lg bg-bad-bg px-3 py-1.5 text-sm font-semibold text-bad-fg">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="mt-2 rounded-lg bg-good-bg px-3 py-1.5 text-sm font-semibold text-good-fg">
            Saved.
          </p>
        ) : null}
      </form>

      {/* Recent readings — each correctable */}
      {recent.length === 0 ? (
        <p className="text-sm text-slate-500">No readings yet.</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((r) => (
            <li key={r.id}>
              <form
                action={editMileageAction}
                className="flex items-center gap-2 rounded-lg border border-slate-100 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">
                    Week of {dateLabel(r.weekStart)} · {r.enteredBy}
                    {r.needsReview ? " · flagged" : ""}
                  </p>
                </div>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="vehicleId" value={vehicleId} />
                <input
                  name="odometer"
                  type="number"
                  inputMode="numeric"
                  defaultValue={r.odometer}
                  className="field h-9 w-28 py-0 text-sm"
                  aria-label={`Odometer for week of ${dateLabel(r.weekStart)}`}
                />
                <button type="submit" className="btn-ghost px-3 text-sm">
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
