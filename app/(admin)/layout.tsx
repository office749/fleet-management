import { requireAdmin } from "@/lib/session";
import { Wordmark } from "@/components/brand";
import { AdminNav } from "@/components/admin-nav";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Wordmark />
            <AdminNav />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-slate-600 md:inline">
              {user.fullName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pb-10">{children}</main>
    </div>
  );
}
