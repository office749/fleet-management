"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createServiceRecord } from "@/lib/data/service";
import { serviceSchema, dollarsToCents } from "@/lib/validation";
import { saveFile, isAllowedUpload } from "@/lib/storage";

export type ServiceState = { ok?: boolean; error?: string };

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export async function addServiceAction(
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  const admin = await requireAdmin();
  const parsed = serviceSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    serviceDate: formData.get("serviceDate"),
    type: formData.get("type"),
    odometer: formData.get("odometer"),
    vendor: formData.get("vendor"),
    cost: formData.get("cost"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const v = parsed.data;
  const date = parseDate(formData.get("serviceDate"));
  if (!date) return { error: "Please pick a valid service date." };

  let receiptPath: string | null = null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const err = isAllowedUpload(receipt.type, receipt.size);
    if (err) return { error: err };
    const buf = Buffer.from(await receipt.arrayBuffer());
    const saved = await saveFile("receipts", receipt.name, buf);
    receiptPath = saved.filePath;
  }

  await createServiceRecord({
    vehicleId: v.vehicleId,
    serviceDate: date,
    type: v.type,
    odometer: typeof v.odometer === "number" ? v.odometer : null,
    vendor: v.vendor || null,
    costCents: dollarsToCents(v.cost),
    notes: v.notes || null,
    receiptPath,
    createdById: admin.id,
  });

  revalidatePath("/service");
  revalidatePath("/dashboard");
  return { ok: true };
}
