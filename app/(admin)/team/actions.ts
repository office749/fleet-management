"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import {
  createUserWithPassword,
  createUserWithInvite,
  adminSetPassword,
  setUserActive,
  regenerateInvite,
  emailExists,
  countAdmins,
} from "@/lib/data/users";
import { prisma } from "@/lib/prisma";

async function baseUrl(): Promise<string> {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

const addSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
  role: z.enum(["admin", "driver"]),
  mode: z.enum(["password", "invite"]),
  password: z.string().optional(),
});

export type AddMemberState = { ok?: boolean; error?: string; inviteUrl?: string };

export async function addMemberAction(
  _prev: AddMemberState,
  formData: FormData,
): Promise<AddMemberState> {
  await requireAdmin();
  const parsed = addSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    mode: formData.get("mode"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  if (await emailExists(d.email)) {
    return { error: "Someone with that email already exists." };
  }

  if (d.mode === "password") {
    if (!d.password || d.password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    await createUserWithPassword({
      email: d.email,
      fullName: d.fullName,
      phone: d.phone,
      role: d.role,
      password: d.password,
    });
    revalidatePath("/team");
    return { ok: true };
  }

  // invite mode
  const { token } = await createUserWithInvite({
    email: d.email,
    fullName: d.fullName,
    phone: d.phone,
    role: d.role,
  });
  revalidatePath("/team");
  return { ok: true, inviteUrl: `${await baseUrl()}/invite/${token}` };
}

export async function setActiveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  // Never deactivate the last active admin.
  if (!active) {
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (user?.role === "admin" && (await countAdmins()) <= 1) {
      return; // silently ignore — the UI hides this control for the last admin
    }
  }
  await setUserActive(id, active);
  revalidatePath("/team");
  revalidatePath("/dashboard");
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") || "");
  if (password.length < 8) return;
  await adminSetPassword(id, password);
  revalidatePath("/team");
}

export async function regenerateInviteAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await regenerateInvite(id);
  revalidatePath("/team");
}
