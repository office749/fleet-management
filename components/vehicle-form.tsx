"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createVehicleAction,
  updateVehicleAction,
  type VehicleFormState,
} from "@/app/(admin)/vehicles/actions";
import { usStates } from "@/lib/validation";

type Driver = { id: string; fullName: string };

type VehicleData = {
  id: string;
  label: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  licensePlate: string | null;
  plateState: string | null;
  status: string;
  insuranceCarrier: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiration: Date | null;
  registrationExpiration: Date | null;
  oilChangeIntervalMiles: number;
  tireCheckIntervalMiles: number;
};

function dateValue(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function VehicleForm({
  drivers,
  vehicle,
  currentDriverId,
}: {
  drivers: Driver[];
  vehicle?: VehicleData;
  currentDriverId?: string | null;
}) {
  const isEdit = !!vehicle;
  const [state, action] = useActionState<VehicleFormState, FormData>(
    isEdit ? updateVehicleAction : createVehicleAction,
    {},
  );

  return (
    <form action={action} className="space-y-6">
      {isEdit ? <input type="hidden" name="id" value={vehicle!.id} /> : null}

      <fieldset className="card space-y-4 p-4">
        <legend className="headline px-1 text-base">Basics</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="label">Label *</label>
            <input id="label" name="label" required className="field"
              defaultValue={vehicle?.label} placeholder="Truck 3" />
          </div>
          <div>
            <label className="label" htmlFor="year">Year</label>
            <input id="year" name="year" type="number" className="field"
              defaultValue={vehicle?.year ?? ""} placeholder="2021" />
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" className="field" defaultValue={vehicle?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="in_shop">In shop</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="make">Make</label>
            <input id="make" name="make" className="field" defaultValue={vehicle?.make ?? ""} placeholder="Ford" />
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <input id="model" name="model" className="field" defaultValue={vehicle?.model ?? ""} placeholder="F-250" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="vin">VIN</label>
            <input id="vin" name="vin" className="field uppercase" maxLength={17}
              defaultValue={vehicle?.vin ?? ""} placeholder="17 characters, no I/O/Q" />
          </div>
          <div>
            <label className="label" htmlFor="licensePlate">License plate</label>
            <input id="licensePlate" name="licensePlate" className="field"
              defaultValue={vehicle?.licensePlate ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="plateState">Plate state</label>
            <select id="plateState" name="plateState" className="field" defaultValue={vehicle?.plateState ?? "UT"}>
              {usStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-4">
        <legend className="headline px-1 text-base">Driver</legend>
        <div>
          <label className="label" htmlFor="driverId">Assigned driver</label>
          <select id="driverId" name="driverId" className="field" defaultValue={currentDriverId ?? ""}>
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-4">
        <legend className="headline px-1 text-base">Insurance & registration</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="insuranceCarrier">Insurance carrier</label>
            <input id="insuranceCarrier" name="insuranceCarrier" className="field"
              defaultValue={vehicle?.insuranceCarrier ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="insurancePolicyNumber">Policy number</label>
            <input id="insurancePolicyNumber" name="insurancePolicyNumber" className="field"
              defaultValue={vehicle?.insurancePolicyNumber ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="insuranceExpiration">Insurance expires</label>
            <input id="insuranceExpiration" name="insuranceExpiration" type="date" className="field"
              defaultValue={dateValue(vehicle?.insuranceExpiration ?? null)} />
          </div>
          <div>
            <label className="label" htmlFor="registrationExpiration">Registration expires</label>
            <input id="registrationExpiration" name="registrationExpiration" type="date" className="field"
              defaultValue={dateValue(vehicle?.registrationExpiration ?? null)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-4">
        <legend className="headline px-1 text-base">Service thresholds</legend>
        <p className="text-sm text-slate-500">
          How many miles between services before the dashboard flags this vehicle.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="oilChangeIntervalMiles">Oil change interval (mi)</label>
            <input id="oilChangeIntervalMiles" name="oilChangeIntervalMiles" type="number" className="field"
              defaultValue={vehicle?.oilChangeIntervalMiles ?? 5000} />
          </div>
          <div>
            <label className="label" htmlFor="tireCheckIntervalMiles">Tire check interval (mi)</label>
            <input id="tireCheckIntervalMiles" name="tireCheckIntervalMiles" type="number" className="field"
              defaultValue={vehicle?.tireCheckIntervalMiles ?? 50000} />
          </div>
        </div>
      </fieldset>

      {state.error ? (
        <p className="rounded-lg bg-bad-bg px-3 py-2 text-sm font-semibold text-bad-fg">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SaveButton label={isEdit ? "Save changes" : "Create vehicle"} />
        {isEdit && state && !state.error ? (
          <span className="text-sm text-slate-400">Changes save to this vehicle.</span>
        ) : null}
      </div>
    </form>
  );
}
