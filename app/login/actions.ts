"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  // Decide where to land based on role (drivers -> /home, admins -> /dashboard).
  let redirectTo = next && next.startsWith("/") ? next : undefined;
  if (!redirectTo) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    redirectTo = user?.role === "admin" ? "/dashboard" : "/home";
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "That email or password is incorrect." };
    }
    throw err; // redirect() throws intentionally — let it bubble
  }
  return {};
}
