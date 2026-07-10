import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listVehiclesForAdmin } from "@/lib/data/vehicles";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { expiryTone, dateLabel } from "@/lib/expiry";
import { VEHICLE_STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

const STATUS_TONE = { active: "good", in_shop: "warn", retired: "neutral" } as const;

export default async function VehiclesPage() {
  await requireAdmin();
  const vehicles = await listVehiclesForAdmin();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="headline text-2xl">Vehicles</h1>
        <Link href="/vehicles/new" className="btn-primary">
          <Plus className="h-5 w-5" />
          Add vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="card p-8 text-center text-slate-600">
          No vehicles yet. Click <strong>Add vehicle</strong> to create your first one.
        </div>
      ) : (
        <ul className="space-y-2">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link
                href={`/vehicles/${v.id}`}
                className="card flex items-center gap-3 p-4 transition hover:border-brand"
              >
                <StatusDot tone={STATUS_TONE[v.status]} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-lg font-extrabold text-ink">{v.label}</p>
                    {v.status !== "active" ? (
                      <StatusBadge tone={STATUS_TONE[v.status]}>
                        {VEHICLE_STATUS_LABELS[v.status]}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    {[v.year, v.make, v.model].filter(Boolean).join(" ") || "—"}
                    {v.activeDrivers.length > 0
                      ? ` · ${v.activeDrivers.map((d) => d.fullName).join(", ")}`
                      : " · Unassigned"}
                  </p>
                </div>
                <div className="hidden gap-2 sm:flex">
                  <StatusBadge tone={expiryTone(v.insuranceExpiration)}>
                    Ins {dateLabel(v.insuranceExpiration)}
                  </StatusBadge>
                  <StatusBadge tone={expiryTone(v.registrationExpiration)}>
                    Reg {dateLabel(v.registrationExpiration)}
                  </StatusBadge>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
