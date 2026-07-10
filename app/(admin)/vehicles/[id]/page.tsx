import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getVehicleById } from "@/lib/data/vehicles";
import { listActiveDrivers } from "@/lib/data/users";
import { recentMileage, currentWeekMileage } from "@/lib/data/mileage";
import { currentWeekStart, formatWeekRange } from "@/lib/week";
import { prisma } from "@/lib/prisma";
import { VehicleForm } from "@/components/vehicle-form";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";
import { AdminMileage } from "@/components/admin-mileage";
import { StatusBadge } from "@/components/status-badge";
import { expiryTone, dateLabel } from "@/lib/expiry";
import { DOC_TYPE_LABELS } from "@/lib/labels";
import { uploadDocumentAction, deleteDocumentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [vehicle, drivers] = await Promise.all([
    getVehicleById(id),
    listActiveDrivers(),
  ]);
  if (!vehicle) notFound();

  const [docs, recent, thisWeek] = await Promise.all([
    prisma.document.findMany({
      where: { vehicleId: id },
      orderBy: [{ docType: "asc" }, { createdAt: "desc" }],
    }),
    recentMileage(id, 6),
    currentWeekMileage(id),
  ]);

  const currentDriverId = vehicle.assignments[0]?.driver.id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/vehicles" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          <ArrowLeft className="h-4 w-4" /> Back to vehicles
        </Link>
        <h1 className="headline text-2xl">{vehicle.label}</h1>
      </div>

      <VehicleForm drivers={drivers} vehicle={vehicle} currentDriverId={currentDriverId} />

      {/* Documents */}
      <section className="card p-4">
        <h2 className="headline mb-3 text-lg">Documents</h2>
        {docs.length === 0 ? (
          <p className="mb-4 text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <FileText className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <a href={`/api/files/${d.id}`} target="_blank" rel="noopener noreferrer"
                    className="font-bold text-ink hover:text-brand">
                    {DOC_TYPE_LABELS[d.docType]} — {d.fileName}
                  </a>
                  {d.expirationDate ? (
                    <div className="mt-1">
                      <StatusBadge tone={expiryTone(d.expirationDate)}>
                        Expires {dateLabel(d.expirationDate)}
                      </StatusBadge>
                    </div>
                  ) : null}
                </div>
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <button className="btn-ghost px-3 text-bad" aria-label="Delete document">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={uploadDocumentAction} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
          <input type="hidden" name="vehicleId" value={vehicle.id} />
          <div className="sm:col-span-1">
            <label className="label" htmlFor="docType">Type</label>
            <select id="docType" name="docType" className="field" defaultValue="insurance">
              <option value="insurance">Insurance</option>
              <option value="registration">Registration</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="label" htmlFor="expirationDate">Expiration</label>
            <input id="expirationDate" name="expirationDate" type="date" className="field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="file">File (PDF or photo)</label>
            <input id="file" name="file" type="file" accept="image/*,application/pdf" required
              className="field py-2 text-sm" />
          </div>
          <div className="sm:col-span-4">
            <button className="btn-primary">
              <Upload className="h-4 w-4" /> Upload document
            </button>
          </div>
        </form>
      </section>

      {/* Weekly mileage — record / correct */}
      <AdminMileage
        vehicleId={vehicle.id}
        weekLabel={formatWeekRange(currentWeekStart())}
        thisWeekValue={thisWeek?.odometer ?? null}
        recent={recent.map((r) => ({
          id: r.id,
          odometer: r.odometer,
          weekStart: r.weekStart,
          enteredBy: r.enteredBy.fullName,
          needsReview: r.needsReview,
        }))}
      />

      {/* Danger zone */}
      <section className="card border-2 border-bad/30 p-4">
        <h2 className="mb-1 text-lg font-bold text-bad-fg">Delete this vehicle</h2>
        <p className="mb-3 text-sm text-slate-600">
          Permanently removes {vehicle.label} and its mileage, service records, and
          documents. This cannot be undone.
        </p>
        <DeleteVehicleButton id={vehicle.id} label={vehicle.label} />
      </section>
    </div>
  );
}
