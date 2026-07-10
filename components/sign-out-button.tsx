import { signOut } from "@/auth";
import { LogOut } from "lucide-react";

/** Sign-out control backed by a server action (works without client JS). */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button type="submit" className={className ?? "btn-ghost text-sm"}>
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
