"use server";
import { signIn } from "@/auth";
import { acceptInvite } from "@/lib/data/users";

export type InviteState = { error?: string };

export async function acceptInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const token = String(formData.get("token") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  try {
    await acceptInvite(token, password);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not set your password." };
  }

  // Log them straight in after accepting.
  await signIn("credentials", { email, password, redirectTo: "/home" });
  return {};
}
