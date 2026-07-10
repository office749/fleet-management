import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

/**
 * SECURITY: the driver-scoping rule lives here and only here. Any driver-facing
 * read of a vehicle (and everything hanging off it) must pass through
 * `assertVehicleAccess` / `driverVehicleIds`.
 */

/** IDs of vehicles a driver is CURRENTLY assigned to (active assignments). */
export async function driverVehicleIds(userId: string): Promise<string[]> {
  const rows = await prisma.vehicleAssignment.findMany({
    where: { driverId: userId, unassignedAt: null },
    select: { vehicleId: true },
  });
  return rows.map((r) => r.vehicleId);
}

/** Throw unless the user may access the vehicle (admins: always; drivers: assigned). */
export async function assertVehicleAccess(
  user: SessionUser,
  vehicleId: string,
): Promise<void> {
  if (user.role === "admin") return;
  const count = await prisma.vehicleAssignment.count({
    where: { vehicleId, driverId: user.id, unassignedAt: null },
  });
  if (count === 0) {
    throw new Error("Not authorized for this vehicle.");
  }
}

/** The single vehicle a driver drives right now (or null if unassigned). */
export async function getDriverVehicle(userId: string) {
  const assignment = await prisma.vehicleAssignment.findFirst({
    where: { driverId: userId, unassignedAt: null },
    orderBy: { assignedAt: "desc" },
    include: { vehicle: true },
  });
  return assignment?.vehicle ?? null;
}

/** Admin: all vehicles with their active driver names. */
export async function listVehiclesForAdmin() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { label: "asc" },
    include: {
      assignments: {
        where: { unassignedAt: null },
        include: { driver: { select: { id: true, fullName: true } } },
      },
    },
  });
  return vehicles.map((v) => ({
    ...v,
    activeDrivers: v.assignments.map((a) => a.driver),
  }));
}

/** Fetch a single vehicle (admin use). */
export async function getVehicleById(vehicleId: string) {
  return prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      assignments: {
        where: { unassignedAt: null },
        include: { driver: { select: { id: true, fullName: true } } },
      },
    },
  });
}

export async function createVehicle(data: Prisma.VehicleCreateInput) {
  return prisma.vehicle.create({ data });
}

export async function updateVehicle(
  vehicleId: string,
  data: Prisma.VehicleUpdateInput,
) {
  return prisma.vehicle.update({ where: { id: vehicleId }, data });
}

/**
 * Assign a driver to a vehicle. For v1 (one driver per vehicle), we close any
 * existing active assignment on that vehicle first. The join-table design means
 * lifting that restriction later (multi-driver) needs no schema change.
 */
export async function assignDriver(vehicleId: string, driverId: string | null) {
  await prisma.vehicleAssignment.updateMany({
    where: { vehicleId, unassignedAt: null },
    data: { unassignedAt: new Date() },
  });
  if (driverId) {
    await prisma.vehicleAssignment.create({ data: { vehicleId, driverId } });
  }
}
