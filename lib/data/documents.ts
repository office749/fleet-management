import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { assertVehicleAccess } from "@/lib/data/vehicles";

/** Documents for a vehicle. Enforces driver scoping. */
export async function listDocuments(user: SessionUser, vehicleId: string) {
  await assertVehicleAccess(user, vehicleId);
  return prisma.document.findMany({
    where: { vehicleId },
    orderBy: [{ docType: "asc" }, { createdAt: "desc" }],
  });
}

/** Fetch a single document with an access check (used by the file route). */
export async function getDocumentForUser(user: SessionUser, documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return null;
  await assertVehicleAccess(user, doc.vehicleId); // throws if not allowed
  return doc;
}

export async function createDocument(data: {
  vehicleId: string;
  docType: "insurance" | "registration" | "other";
  fileName: string;
  filePath: string;
  mimeType?: string | null;
  expirationDate?: Date | null;
  uploadedById: string;
}) {
  return prisma.document.create({ data });
}

/** Admin-only delete (drivers can never delete). */
export async function deleteDocument(documentId: string) {
  return prisma.document.delete({ where: { id: documentId } });
}
