"use client";
import { Trash2 } from "lucide-react";
import { deleteVehicleAction } from "@/app/(admin)/vehicles/actions";

/** Delete a vehicle with a confirmation prompt (admin only). */
export function DeleteVehicleButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteVehicleAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Delete "${label}"? This permanently removes the vehicle and all of its mileage, service records, and documents. This cannot be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-danger">
        <Trash2 className="h-4 w-4" />
        Delete vehicle
      </button>
    </form>
  );
}
