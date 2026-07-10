"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import {
  createVehicle,
  updateVehicle,
  assignDriver,
} from "@/lib/data/vehicles";
import { createDocument, deleteDocument } from "@/lib/data/documents";
import { vehicleSchema } from "@/lib/validation";
import { saveFile, deleteFile, isAllowedUpload } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export type VehicleFormState = { error?: string };

/** yyyy-mm-dd string -> Date at UTC midnight, or null. */
function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function toVehicleData(formData: FormData) {
  const parsed = vehicleSchema.safeParse({
    label: formData.get("label"),
    year: formData.get("year"),
    make: formData.get("make"),
    model: formData.get("model"),
    vin: formData.get("vin"),
    licensePlate: formData.get("licensePlate"),
    plateState: formData.get("plateState"),
    status: formData.get("status"),
    insuranceCarrier: formData.get("insuranceCarrier"),
    insurancePolicyNumber: formData.get("insurancePolicyNumber"),
    oilChangeIntervalMiles: formData.get("oilChangeIntervalMiles"),
    tireCheckIntervalMiles: formData.get("tireCheckIntervalMiles"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const v = parsed.data;
  return {
    data: {
      label: v.label,
      year: v.year ?? null,
      make: v.make || null,
      model: v.model || null,
      vin: v.vin ? v.vin : null,
      licensePlate: v.licensePlate || null,
      plateState: v.plateState || null,
      status: v.status,
      insuranceCarrier: v.insuranceCarrier || null,
      insurancePolicyNumber: v.insurancePolicyNumber || null,
      insuranceExpiration: parseDate(formData.get("insuranceExpiration")),
      registrationExpiration: parseDate(formData.get("registrationExpiration")),
      oilChangeIntervalMiles: v.oilChangeIntervalMiles,
      tireCheckIntervalMiles: v.tireCheckIntervalMiles,
    },
  };
}

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  await requireAdmin();
  const result = toVehicleData(formData);
  if ("error" in result) return { error: result.error };

  // Guard against duplicate VIN with a friendly message.
  if (result.data.vin) {
    const existing = await prisma.vehicle.findUnique({ where: { vin: result.data.vin } });
    if (existing) return { error: "A vehicle with that VIN already exists." };
  }

  const created = await createVehicle(result.data);
  const driverId = String(formData.get("driverId") || "");
  if (driverId) await assignDriver(created.id, driverId);

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  redirect(`/vehicles/${created.id}`);
}

export async function updateVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const result = toVehicleData(formData);
  if ("error" in result) return { error: result.error };

  if (result.data.vin) {
    const existing = await prisma.vehicle.findFirst({
      where: { vin: result.data.vin, id: { not: id } },
    });
    if (existing) return { error: "A vehicle with that VIN already exists." };
  }

  await updateVehicle(id, result.data);

  // Assignment is submitted with the same form.
  const driverId = String(formData.get("driverId") || "");
  await assignDriver(id, driverId || null);

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function uploadDocumentAction(formData: FormData) {
  const admin = await requireAdmin();
  const vehicleId = String(formData.get("vehicleId"));
  const docType = String(formData.get("docType")) as
    | "insurance"
    | "registration"
    | "other";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const err = isAllowedUpload(file.type, file.size);
  if (err) throw new Error(err);

  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile("documents", file.name, buf);
  await createDocument({
    vehicleId,
    docType,
    fileName: saved.fileName,
    filePath: saved.filePath,
    mimeType: file.type,
    expirationDate: parseDate(formData.get("expirationDate")),
    uploadedById: admin.id,
  });
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function deleteDocumentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const vehicleId = String(formData.get("vehicleId"));
  const doc = await prisma.document.findUnique({ where: { id } });
  if (doc) {
    await deleteFile(doc.filePath);
    await deleteDocument(id);
  }
  revalidatePath(`/vehicles/${vehicleId}`);
}
