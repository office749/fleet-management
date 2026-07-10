"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { getDriverVehicle } from "@/lib/data/vehicles";
import { submitMileage } from "@/lib/data/mileage";
import { reportIssue } from "@/lib/data/issues";
import { mileageSchema, issueSchema } from "@/lib/validation";
import { saveFile, isAllowedUpload } from "@/lib/storage";

export type MileageState = {
  ok?: boolean;
  error?: string;
  needsConfirm?: boolean;
  jump?: number;
  odometer?: number;
};

export async function submitMileageAction(
  _prev: MileageState,
  formData: FormData,
): Promise<MileageState> {
  const user = await requireUser();
  const vehicle = await getDriverVehicle(user.id);
  if (!vehicle) return { error: "No vehicle is assigned to you yet." };

  const parsed = mileageSchema.safeParse({ odometer: formData.get("odometer") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid number." };
  }
  const confirmed = formData.get("confirmed") === "true";

  const result = await submitMileage({
    vehicleId: vehicle.id,
    odometer: parsed.data.odometer,
    enteredById: user.id,
    confirmed,
  });

  if (!result.ok) {
    return { error: result.error, odometer: parsed.data.odometer };
  }

  // Big jump and not yet confirmed -> ask the driver to confirm.
  if (result.flagged && !confirmed) {
    return {
      needsConfirm: true,
      jump: result.jump ?? undefined,
      odometer: parsed.data.odometer,
    };
  }

  revalidatePath("/home");
  return { ok: true, odometer: parsed.data.odometer };
}

export type IssueState = { ok?: boolean; error?: string };

export async function reportIssueAction(
  _prev: IssueState,
  formData: FormData,
): Promise<IssueState> {
  const user = await requireUser();
  const vehicle = await getDriverVehicle(user.id);
  if (!vehicle) return { error: "No vehicle is assigned to you yet." };

  const parsed = issueSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete the form." };
  }

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const err = isAllowedUpload(photo.type, photo.size);
    if (err) return { error: err };
    const buf = Buffer.from(await photo.arrayBuffer());
    const saved = await saveFile("issues", photo.name, buf);
    photoPath = saved.filePath;
  }

  await reportIssue(user, {
    vehicleId: vehicle.id,
    category: parsed.data.category,
    description: parsed.data.description,
    photoPath,
  });

  revalidatePath("/home");
  return { ok: true };
}
