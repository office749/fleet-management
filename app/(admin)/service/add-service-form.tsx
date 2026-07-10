"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { addServiceAction, type ServiceState } from "./actions";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending}>
      <Plus className="h-4 w-4" /> {pending ? "Saving…" : "Add service record"}
    </button>
  );
}

export function AddServiceForm({
  vehicles,
  defaultVehicleId,
}: {
  vehicles: { id: string; label: string }[];
  defaultVehicleId?: string;
}) {
  const [state, action] = useActionState<ServiceState, FormData>(addServiceAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="vehicleId">Vehicle *</label>
        <select id="vehicleId" name="vehicleId" required className="field" defaultValue={defaultVehicleId ?? ""}>
          <option value="" disabled>Choose…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="type">Type *</label>
        <select id="type" name="type" required className="field" defaultValue="oil_change">
          {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="serviceDate">Date *</label>
        <input id="serviceDate" name="serviceDate" type="date" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="odometer">Odometer (mi)</label>
        <input id="odometer" name="odometer" type="number" className="field" placeholder="e.g. 62000" />
      </div>
      <div>
        <label className="label" htmlFor="vendor">Vendor</label>
        <input id="vendor" name="vendor" className="field" placeholder="Jiffy Lube" />
      </div>
      <div>
        <label className="label" htmlFor="cost">Cost</label>
        <input id="cost" name="cost" inputMode="decimal" className="field" placeholder="$0.00" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className="field py-2" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="receipt">Receipt (PDF or photo)</label>
        <input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" className="field py-2 text-sm" />
      </div>
      {state.error ? (
        <p className="sm:col-span-2 rounded-lg bg-bad-bg px-3 py-2 text-sm font-semibold text-bad-fg">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="sm:col-span-2 rounded-lg bg-good-bg px-3 py-2 text-sm font-semibold text-good-fg">
          Service record saved.
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <SaveBtn />
      </div>
    </form>
  );
}
