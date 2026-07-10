"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { resolveIssue } from "@/lib/data/issues";
import { clearMileageFlag } from "@/lib/data/mileage";

export async function resolveIssueAction(formData: FormData) {
  await requireAdmin();
  await resolveIssue(String(formData.get("id")));
  revalidatePath("/dashboard");
}

export async function clearFlagAction(formData: FormData) {
  await requireAdmin();
  await clearMileageFlag(String(formData.get("id")));
  revalidatePath("/dashboard");
}
