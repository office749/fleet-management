import { requireUser } from "@/lib/session";
import { getDriverVehicle } from "@/lib/data/vehicles";
import {
  currentWeekMileage,
  latestMileage,
  recentMileage,
} from "@/lib/data/mileage";
import { listDocuments } from "@/lib/data/documents";
import { driverServiceHistory } from "@/lib/data/service";
import { currentWeekStart, weekDeadlineLabel } from "@/lib/week";
import { formatMiles } from "@/lib/utils";
import { MileageWidget } from "./mileage-widget";
import { ReportIssue } from "./report-issue";
import { DriverDocuments } from "./documents";
import { StatusBadge } from "@/components/status-badge";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DriverHome() {
  const user = await requireUser();
  const vehicle = await getDriverVehicle(user.id);

  if (!vehicle) {
    return (
      <div className="card mt-6 p-6 text-center">
        <h1 className="headline text-xl">No vehicle assigned yet</h1>
        <p className="mt-2 text-slate-600">
          Your administrator hasn&apos;t assigned a vehicle to you. Please check
          back soon.
        </p>
      </div>
    );
  }

  const [current, latest, docs, service, recent] = await Promise.all([
    currentWeekMileage(vehicle.id),
    latestMileage(vehicle.id),
    listDocuments(user, vehicle.id),
    driverServiceHistory(user, vehicle.id),
    recentMileage(vehicle.id, 4),
  ]);

  // Reference reading = latest reading from BEFORE this week (the "last recorded").
  const priorReading = recent.find(
    (r) => r.weekStart.getTime() < currentWeekStart().getTime(),
  );
  const referenceOdo = priorReading?.odometer ?? latest?.odometer ?? null;
  const deadline = weekDeadlineLabel(currentWeekStart());

  return (
    <div className="space-y-5">
      {/* Vehicle header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{vehicle.label}</h1>
          <p className="text-sm text-slate-500">
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
              "Your vehicle"}
          </p>
        </div>
        {vehicle.status !== "active" ? (
          <StatusBadge tone="warn">
            {vehicle.status === "in_shop" ? "In shop" : "Retired"}
          </StatusBadge>
        ) : null}
      </div>

      {/* THE mileage entry — front and center */}
      <MileageWidget
        submittedThisWeek={current?.odometer ?? null}
        referenceOdo={referenceOdo}
        deadlineLabel={deadline}
      />

      {/* Documents */}
      <DriverDocuments docs={docs} />

      {/* Report an issue */}
      <ReportIssue />

      {/* Recent service (no costs) */}
      <section className="card p-4">
        <h2 className="headline mb-3 text-lg">Recent service</h2>
        {service.length === 0 ? (
          <p className="text-sm text-slate-500">No service on record yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {service.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-semibold text-ink">
                    {SERVICE_TYPE_LABELS[s.type]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.serviceDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                    {s.odometer != null ? ` · ${formatMiles(s.odometer)} mi` : ""}
                    {s.vendor ? ` · ${s.vendor}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
