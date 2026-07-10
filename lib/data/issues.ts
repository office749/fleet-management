import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { assertVehicleAccess } from "@/lib/data/vehicles";

/** Driver reports an issue on their assigned vehicle. */
export async function reportIssue(
  user: SessionUser,
  data: {
    vehicleId: string;
    category: string;
    description: string;
    photoPath?: string | null;
  },
) {
  await assertVehicleAccess(user, data.vehicleId);
  return prisma.issue.create({
    data: {
      vehicleId: data.vehicleId,
      reportedById: user.id,
      category: data.category,
      description: data.description,
      photoPath: data.photoPath ?? null,
    },
  });
}

/** Admin: all open issues, newest first. */
export async function listOpenIssues() {
  return prisma.issue.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { label: true } },
      reportedBy: { select: { fullName: true } },
    },
  });
}

export async function listAllIssues() {
  return prisma.issue.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      vehicle: { select: { label: true } },
      reportedBy: { select: { fullName: true } },
    },
  });
}

export async function resolveIssue(id: string) {
  return prisma.issue.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}
