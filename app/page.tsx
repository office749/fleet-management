import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function Index() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/dashboard" : "/home");
}
