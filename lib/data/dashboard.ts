import "server-only";
import { prisma } from "@/lib/prisma";
import { currentWeekStart } from "@/lib/week";
import { consecutiveMissedWeeks } from "@/lib/data/mileage";

const EXPIRY_WINDOW_DAYS = 30;

export type ExpiryLevel = "expired" | "soon" | "ok";

/** Whole days from today (UTC date) until `date`; negative = already past. */
function daysUntil(date: Date): number {
  const today = new Date();
  const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const b = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

function expiryLevel(date: Date | null): { level: ExpiryLevel; days: number | null } {
  if (!date) return { level: "ok", days: null };
  const days = daysUntil(date);
  if (days < 0) return { level: "expired", days };
  if (days <= EXPIRY_WINDOW_DAYS) return { level: "soon", days };
  return { level: "ok", days };
}

export type ExpiryAlert = {
  vehicleId: string;
  label: string;
  kind: "insurance" | "registration";
  date: Date;
  level: Exclude<ExpiryLevel, "ok">;
  days: number;
};

export type MaintenanceAlert = {
  vehicleId: string;
  label: string;
  kind: "oil_change" | "tire_check";
  state: "due" | "no_record";
  milesOver?: number;
  milesSince?: number;
  threshold: number;
};

export type MissedAlert = {
  vehicleId: string;
  label: string;
  consecutive: number;
};

export type Dashboard = {
  expiry: ExpiryAlert[];
  maintenance: MaintenanceAlert[];
  missed: MissedAlert[];
  flaggedMileage: {
    id: string;
    vehicleLabel: string;
    odometer: number;
    driver: string;
    confirmed: boolean;
  }[];
  openIssues: {
    id: string;
    vehicleLabel: string;
    category: string;
    description: string;
    driver: string;
    hasPhoto: boolean;
    createdAt: Date;
  }[];
  counts: {
    expiry: number;
    maintenance: number;
    missed: number;
    flagged: number;
    issues: number;
    total: number;
  };
};

export async function buildDashboard(): Promise<Dashboard> {
  const weekStart = currentWeekStart();

  const [vehicles, latestMileageRows, lastServices, currentWeekLogs, flagged, issues] =
    await Promise.all([
      prisma.vehicle.findMany(),
      prisma.mileageLog.findMany({
        orderBy: { weekStart: "desc" },
        distinct: ["vehicleId"],
        select: { vehicleId: true, odometer: true },
      }),
      prisma.serviceRecord.findMany({
        where: { type: { in: ["oil_change", "tires"] }, odometer: { not: null } },
        orderBy: { serviceDate: "desc" },
        distinct: ["vehicleId", "type"],
        select: { vehicleId: true, type: true, odometer: true },
      }),
      prisma.mileageLog.findMany({
        where: { weekStart },
        select: { vehicleId: true },
      }),
      prisma.mileageLog.findMany({
        where: { needsReview: true },
        include: {
          vehicle: { select: { label: true } },
          enteredBy: { select: { fullName: true } },
        },
      }),
      prisma.issue.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: { select: { label: true } },
          reportedBy: { select: { fullName: true } },
        },
      }),
    ]);

  const latestOdo = new Map(latestMileageRows.map((r) => [r.vehicleId, r.odometer]));
  const lastOil = new Map<string, number>();
  const lastTire = new Map<string, number>();
  for (const s of lastServices) {
    if (s.odometer == null) continue;
    if (s.type === "oil_change") lastOil.set(s.vehicleId, s.odometer);
    if (s.type === "tires") lastTire.set(s.vehicleId, s.odometer);
  }
  const hasCurrentReading = new Set(currentWeekLogs.map((l) => l.vehicleId));

  const expiry: ExpiryAlert[] = [];
  const maintenance: MaintenanceAlert[] = [];
  const missed: MissedAlert[] = [];

  for (const v of vehicles) {
    if (v.status !== "active") continue; // maintenance/missed alerts are for active vehicles

    // --- Expirations ---
    for (const [kind, date] of [
      ["insurance", v.insuranceExpiration],
      ["registration", v.registrationExpiration],
    ] as const) {
      const { level, days } = expiryLevel(date ?? null);
      if (date && (level === "expired" || level === "soon")) {
        expiry.push({ vehicleId: v.id, label: v.label, kind, date, level, days: days! });
      }
    }

    // --- Oil change ---
    const odo = latestOdo.get(v.id);
    const oilOdo = lastOil.get(v.id);
    if (oilOdo == null) {
      maintenance.push({
        vehicleId: v.id,
        label: v.label,
        kind: "oil_change",
        state: "no_record",
        threshold: v.oilChangeIntervalMiles,
      });
    } else if (odo != null) {
      const since = odo - oilOdo;
      if (since >= v.oilChangeIntervalMiles) {
        maintenance.push({
          vehicleId: v.id,
          label: v.label,
          kind: "oil_change",
          state: "due",
          milesSince: since,
          milesOver: since - v.oilChangeIntervalMiles,
          threshold: v.oilChangeIntervalMiles,
        });
      }
    }

    // --- Tire check ---
    const tireOdo = lastTire.get(v.id);
    if (tireOdo == null) {
      maintenance.push({
        vehicleId: v.id,
        label: v.label,
        kind: "tire_check",
        state: "no_record",
        threshold: v.tireCheckIntervalMiles,
      });
    } else if (odo != null) {
      const since = odo - tireOdo;
      if (since >= v.tireCheckIntervalMiles) {
        maintenance.push({
          vehicleId: v.id,
          label: v.label,
          kind: "tire_check",
          state: "due",
          milesSince: since,
          milesOver: since - v.tireCheckIntervalMiles,
          threshold: v.tireCheckIntervalMiles,
        });
      }
    }

    // --- Missed mileage ---
    if (!hasCurrentReading.has(v.id)) {
      const consecutive = await consecutiveMissedWeeks(v.id);
      missed.push({ vehicleId: v.id, label: v.label, consecutive: Math.max(1, consecutive) });
    }
  }

  // Sort expirations most-urgent first (fewest days remaining).
  expiry.sort((a, b) => a.days - b.days);
  missed.sort((a, b) => b.consecutive - a.consecutive);

  const flaggedMileage = flagged.map((f) => ({
    id: f.id,
    vehicleLabel: f.vehicle.label,
    odometer: f.odometer,
    driver: f.enteredBy.fullName,
    confirmed: f.driverConfirmed,
  }));

  const openIssues = issues.map((i) => ({
    id: i.id,
    vehicleLabel: i.vehicle.label,
    category: i.category,
    description: i.description,
    driver: i.reportedBy.fullName,
    hasPhoto: !!i.photoPath,
    createdAt: i.createdAt,
  }));

  const counts = {
    expiry: expiry.length,
    maintenance: maintenance.length,
    missed: missed.length,
    flagged: flaggedMileage.length,
    issues: openIssues.length,
    total:
      expiry.length +
      maintenance.length +
      missed.length +
      flaggedMileage.length +
      openIssues.length,
  };

  return { expiry, maintenance, missed, flaggedMileage, openIssues, counts };
}
