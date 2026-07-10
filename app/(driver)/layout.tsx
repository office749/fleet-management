import { requireUser } from "@/lib/session";
import { Wordmark } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Wordmark />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
              {user.fullName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}
