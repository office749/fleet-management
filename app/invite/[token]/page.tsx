import { Wordmark } from "@/components/brand";
import { getUserByInviteToken } from "@/lib/data/users";
import { AcceptInviteForm } from "./accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getUserByInviteToken(token);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark onDark large />
        </div>
        <div className="card p-6">
          {user ? (
            <>
              <h1 className="headline mb-1 text-xl">Welcome, {user.fullName}!</h1>
              <p className="mb-5 text-sm text-slate-600">
                Set a password to finish setting up your account.
              </p>
              <AcceptInviteForm token={token} email={user.email} />
            </>
          ) : (
            <>
              <h1 className="headline mb-2 text-xl">Invite not valid</h1>
              <p className="text-sm text-slate-600">
                This invite link is invalid or has expired. Please ask your fleet
                administrator to send a new one.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
