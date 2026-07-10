import { Wordmark } from "@/components/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Wordmark onDark className="text-2xl" />
          </div>
          <p className="text-sm text-brand-100">Fleet management sign in</p>
        </div>
        <div className="card p-6">
          <LoginForm next={next} initialError={error} />
        </div>
        <p className="mt-6 text-center text-xs text-brand-100">
          Trouble signing in? Contact your fleet administrator.
        </p>
      </div>
    </main>
  );
}
