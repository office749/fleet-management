import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  role: "admin" | "driver";
  fullName: string;
  email: string;
};

/** Return the current user or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    fullName: session.user.fullName,
    email: session.user.email ?? "",
  };
}

/** Require any logged-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an admin; drivers are bounced to their home. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/home");
  return user;
}
