import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { listTeam } from "@/lib/data/users";
import { StatusBadge } from "@/components/status-badge";
import { AddMemberForm } from "./add-member-form";
import {
  setActiveAction,
  resetPasswordAction,
  regenerateInviteAction,
} from "./actions";

export const dynamic = "force-dynamic";

async function origin(): Promise<string> {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export default async function TeamPage() {
  await requireAdmin();
  const [team, base] = await Promise.all([listTeam(), origin()]);
  const activeAdmins = team.filter((m) => m.role === "admin" && m.isActive).length;

  return (
    <div className="space-y-6">
      <h1 className="headline text-2xl">Team</h1>

      <section className="card p-4">
        <h2 className="headline mb-3 text-lg">Add a team member</h2>
        <AddMemberForm />
      </section>

      <section className="card p-4">
        <h2 className="headline mb-3 text-lg">Members</h2>
        <ul className="space-y-3">
          {team.map((m) => {
            const isLastAdmin = m.role === "admin" && m.isActive && activeAdmins <= 1;
            return (
              <li key={m.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-ink">{m.fullName}</p>
                      <StatusBadge tone={m.role === "admin" ? "neutral" : "neutral"}>
                        {m.role === "admin" ? "Admin" : "Driver"}
                      </StatusBadge>
                      {!m.isActive ? (
                        <StatusBadge tone="bad">Deactivated</StatusBadge>
                      ) : m.pendingInvite ? (
                        <StatusBadge tone="warn">Invite pending</StatusBadge>
                      ) : (
                        <StatusBadge tone="good">Active</StatusBadge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{m.email}</p>
                    <p className="text-sm text-slate-500">
                      {m.vehicle ? `Drives ${m.vehicle.label}` : "No vehicle assigned"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {m.isActive ? (
                      !isLastAdmin ? (
                        <form action={setActiveAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="active" value="false" />
                          <button className="btn-ghost px-3 text-sm text-bad">Deactivate</button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-400">Last admin</span>
                      )
                    ) : (
                      <form action={setActiveAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="active" value="true" />
                        <button className="btn-ghost px-3 text-sm text-brand">Reactivate</button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Pending invite link */}
                {m.pendingInvite && m.inviteToken ? (
                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Invite link</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input readOnly value={`${base}/invite/${m.inviteToken}`}
                        className="field h-9 min-w-0 flex-1 bg-white py-0 text-xs" />
                      <form action={regenerateInviteAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="btn-ghost px-3 text-xs">New link</button>
                      </form>
                    </div>
                  </div>
                ) : null}

                {/* Reset password */}
                {m.hasPassword ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-brand">
                      Reset password
                    </summary>
                    <form action={resetPasswordAction} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="password" className="field h-10 w-56 py-0 text-sm"
                        placeholder="New password (8+ chars)" />
                      <button className="btn-ghost px-3 text-sm">Set password</button>
                    </form>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
