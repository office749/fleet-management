import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  adminServiceHistory,
  costTotalsByVehicle,
  costTotalsByMonth,
} from "@/lib/data/service";
import { formatMoney, formatMiles, monthLabel } from "@/lib/utils";
import { dateLabel } from "@/lib/expiry";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
import { AddServiceForm } from "./add-service-form";

export const dynamic = "force-dynamic";

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  await requireAdmin();
  const { vehicle: vehicleFilter } = await searchParams;

  const [vehicles, history, totals, monthly] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } }),
    adminServiceHistory(vehicleFilter || undefined),
    costTotalsByVehicle(),
    costTotalsByMonth(new Date().getUTCFullYear()),
  ]);

  const year = new Date().getUTCFullYear();

  return (
    <div className="space-y-6">
      <h1 className="headline text-2xl">Service log</h1>

      {/* Cost totals */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="headline mb-3 text-lg">Cost by vehicle</h2>
          {totals.rows.length === 0 ? (
            <p className="text-sm text-slate-500">No costs recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {totals.rows.map((r) => (
                <li key={r.vehicleId} className="flex justify-between py-1.5 text-sm">
                  <span className="font-semibold text-ink">{r.label}</span>
                  <span className="tabular-nums">{formatMoney(r.totalCents)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t-2 border-slate-200 py-2 font-bold">
                <span>Fleet total</span>
                <span className="tabular-nums text-brand-dark">{formatMoney(totals.grand)}</span>
              </li>
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="headline mb-3 text-lg">Cost by month ({year})</h2>
          {monthly.length === 0 ? (
            <p className="text-sm text-slate-500">No costs recorded this year.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {monthly.map((m) => (
                <li key={m.ym} className="flex justify-between py-1.5 text-sm">
                  <span className="font-semibold text-ink">{monthLabel(m.ym)}</span>
                  <span className="tabular-nums">{formatMoney(m.totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Add service */}
      <section className="card p-4">
        <h2 className="headline mb-3 text-lg">Add a service record</h2>
        <AddServiceForm vehicles={vehicles} defaultVehicleId={vehicleFilter} />
      </section>

      {/* History with filter */}
      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="headline text-lg">History</h2>
          <form className="flex items-center gap-2">
            <label htmlFor="vehicle" className="text-sm font-semibold text-slate-600">Filter:</label>
            <select
              id="vehicle"
              name="vehicle"
              defaultValue={vehicleFilter ?? ""}
              className="field h-10 w-44 py-0 text-sm"
            >
              <option value="">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            <button className="btn-ghost px-3 text-sm">Apply</button>
          </form>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No service records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Vehicle</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Odometer</th>
                  <th className="py-2 pr-3">Vendor</th>
                  <th className="py-2 pr-3 text-right">Cost</th>
                  <th className="py-2 pr-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 whitespace-nowrap">{dateLabel(s.serviceDate)}</td>
                    <td className="py-2 pr-3 font-semibold">{s.vehicle.label}</td>
                    <td className="py-2 pr-3">{SERVICE_TYPE_LABELS[s.type]}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {s.odometer != null ? `${formatMiles(s.odometer)} mi` : "—"}
                    </td>
                    <td className="py-2 pr-3">{s.vendor ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(s.costCents)}</td>
                    <td className="py-2 pr-3">
                      {s.receiptPath ? (
                        <Link href={`/api/receipts/${s.id}`} target="_blank"
                          className="inline-flex items-center gap-1 text-brand hover:underline">
                          <Receipt className="h-4 w-4" /> View
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
