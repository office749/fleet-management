import "server-only";
import { prisma } from "@/lib/prisma";
import { currentWeekStart, shiftWeeks } from "@/lib/week";
import { MILEAGE_JUMP_FLAG } from "@/lib/validation";

/** The most recent mileage reading for a vehicle (any week), or null. */
export async function latestMileage(vehicleId: string) {
  return prisma.mileageLog.findFirst({
    where: { vehicleId },
    orderBy: { weekStart: "desc" },
  });
}

/** This week's reading for a vehicle, if any. */
export async function currentWeekMileage(vehicleId: string) {
  return prisma.mileageLog.findUnique({
    where: { vehicleId_weekStart: { vehicleId, weekStart: currentWeekStart() } },
  });
}

/** Recent readings (most recent first). */
export async function recentMileage(vehicleId: string, take = 8) {
  return prisma.mileageLog.findMany({
    where: { vehicleId },
    orderBy: { weekStart: "desc" },
    take,
    include: { enteredBy: { select: { fullName: true } } },
  });
}

export type SubmitMileageResult =
  | { ok: true; flagged: boolean; jump: number | null }
  | { ok: false; error: string; previous?: number };

/**
 * Submit (or update) this week's reading for a vehicle.
 * - Must be >= the previous reading.
 * - A jump over MILEAGE_JUMP_FLAG is accepted but flagged for admin review;
 *   `confirmed` records that the driver acknowledged the "is that right?" prompt.
 */
export async function submitMileage(params: {
  vehicleId: string;
  odometer: number;
  enteredById: string;
  confirmed?: boolean;
}): Promise<SubmitMileageResult> {
  const { vehicleId, odometer, enteredById, confirmed } = params;
  const weekStart = currentWeekStart();

  const previous = await prisma.mileageLog.findFirst({
    where: { vehicleId, weekStart: { lt: weekStart } },
    orderBy: { weekStart: "desc" },
  });

  if (previous && odometer < previous.odometer) {
    return {
      ok: false,
      error: `Reading must be at least the last one (${previous.odometer.toLocaleString()} mi).`,
      previous: previous.odometer,
    };
  }

  const jump = previous ? odometer - previous.odometer : null;
  const flagged = jump != null && jump > MILEAGE_JUMP_FLAG;

  await prisma.mileageLog.upsert({
    where: { vehicleId_weekStart: { vehicleId, weekStart } },
    create: {
      vehicleId,
      weekStart,
      odometer,
      enteredById,
      needsReview: flagged,
      driverConfirmed: flagged ? !!confirmed : false,
    },
    update: {
      odometer,
      enteredById,
      needsReview: flagged,
      driverConfirmed: flagged ? !!confirmed : false,
    },
  });

  return { ok: true, flagged, jump };
}

/** Admin edit/correction of any reading. */
export async function adminUpdateMileage(id: string, odometer: number) {
  return prisma.mileageLog.update({
    where: { id },
    data: { odometer, needsReview: false },
  });
}

/** Clear the review flag once an admin has looked at it. */
export async function clearMileageFlag(id: string) {
  return prisma.mileageLog.update({
    where: { id },
    data: { needsReview: false, driverConfirmed: true },
  });
}

/**
 * Count consecutive missed weeks for a vehicle, ending at the current week.
 * A week is "missed" if there is no reading with that weekStart.
 */
export async function consecutiveMissedWeeks(
  vehicleId: string,
  lookback = 12,
): Promise<number> {
  const start = currentWeekStart();
  const logs = await prisma.mileageLog.findMany({
    where: { vehicleId, weekStart: { gte: shiftWeeks(start, -lookback) } },
    select: { weekStart: true },
  });
  const have = new Set(logs.map((l) => l.weekStart.toISOString().slice(0, 10)));
  let missed = 0;
  for (let i = 0; i < lookback; i++) {
    const wk = shiftWeeks(start, -i).toISOString().slice(0, 10);
    if (have.has(wk)) break;
    missed++;
  }
  return missed;
}
