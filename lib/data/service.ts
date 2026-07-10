import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { assertVehicleAccess } from "@/lib/data/vehicles";

/**
 * DRIVER-FACING service history — WITHOUT cost. The `select` deliberately omits
 * costCents and receiptPath so a driver response can never contain a dollar
 * figure or a receipt. This is our column-level guard now that we don't have
 * Supabase RLS.
 */
export async function driverServiceHistory(user: SessionUser, vehicleId: string) {
  await assertVehicleAccess(user, vehicleId);
  return prisma.serviceRecord.findMany({
    where: { vehicleId },
    orderBy: { serviceDate: "desc" },
    take: 10,
    select: {
      id: true,
      serviceDate: true,
      odometer: true,
      type: true,
      vendor: true,
      notes: true,
      // costCents and receiptPath intentionally excluded.
    },
  });
}

/** ADMIN service history (full, includes cost + receipt). */
export async function adminServiceHistory(vehicleId?: string, type?: string) {
  return prisma.serviceRecord.findMany({
    where: {
      ...(vehicleId ? { vehicleId } : {}),
      ...(type ? { type: type as never } : {}),
    },
    orderBy: { serviceDate: "desc" },
    include: { vehicle: { select: { label: true } } },
  });
}

export async function createServiceRecord(data: {
  vehicleId: string;
  serviceDate: Date;
  type: "oil_change" | "tires" | "brakes" | "repair" | "inspection" | "other";
  odometer?: number | null;
  vendor?: string | null;
  costCents?: number | null;
  notes?: string | null;
  receiptPath?: string | null;
  createdById: string;
}) {
  return prisma.serviceRecord.create({ data });
}

/** Most recent oil-change / tire-service odometer for a vehicle, or null. */
export async function lastServiceOdometer(
  vehicleId: string,
  types: ("oil_change" | "tires")[],
) {
  const rec = await prisma.serviceRecord.findFirst({
    where: { vehicleId, type: { in: types }, odometer: { not: null } },
    orderBy: [{ serviceDate: "desc" }, { odometer: "desc" }],
    select: { odometer: true, serviceDate: true, type: true },
  });
  return rec;
}

/** Cost totals per vehicle and grand total. */
export async function costTotalsByVehicle() {
  const grouped = await prisma.serviceRecord.groupBy({
    by: ["vehicleId"],
    _sum: { costCents: true },
  });
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, label: true },
  });
  const labelById = new Map(vehicles.map((v) => [v.id, v.label]));
  const rows = grouped
    .map((g) => ({
      vehicleId: g.vehicleId,
      label: labelById.get(g.vehicleId) ?? "—",
      totalCents: g._sum.costCents ?? 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
  const grand = rows.reduce((s, r) => s + r.totalCents, 0);
  return { rows, grand };
}

/** Cost totals grouped by "YYYY-MM" for the given year (fleet-wide). */
export async function costTotalsByMonth(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const records = await prisma.serviceRecord.findMany({
    where: { serviceDate: { gte: start, lt: end } },
    select: { serviceDate: true, costCents: true },
  });
  const byMonth = new Map<string, number>();
  for (const r of records) {
    const ym = r.serviceDate.toISOString().slice(0, 7);
    byMonth.set(ym, (byMonth.get(ym) ?? 0) + (r.costCents ?? 0));
  }
  return Array.from(byMonth.entries())
    .map(([ym, totalCents]) => ({ ym, totalCents }))
    .sort((a, b) => a.ym.localeCompare(b.ym));
}
