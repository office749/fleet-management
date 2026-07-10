import Link from "next/link";
import {
  ShieldAlert,
  Droplet,
  CircleDot,
  CalendarX,
  Flag,
  MessageSquareWarning,
  PartyPopper,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { buildDashboard } from "@/lib/data/dashboard";
import { StatusBadge } from "@/components/status-badge";
import { formatMiles } from "@/lib/utils";
import { resolveIssueAction, clearFlagAction } from "./actions";

export const dynamic = "force-dynamic";

function AlertCard({
  icon: Icon,
  title,
  count,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  tone: "bad" | "warn" | "neutral";
  children: React.ReactNode;
}) {
  const ring =
    tone === "bad" ? "border-bad/30" : tone === "warn" ? "border-warn/30" : "border-slate-200";
  return (
    <section className={`card border-2 ${ring} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand-dark" />
        <h2 className="headline text-lg">{title}</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-700">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function expiryDateLabel(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const d = await buildDashboard();

  if (d.counts.total === 0) {
    return (
      <div>
        <h1 className="headline mb-1 text-2xl">Good morning, {admin.fullName.split(" ")[0]}</h1>
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <PartyPopper className="h-12 w-12 text-good" />
          <h2 className="text-xl font-extrabold text-ink">Nothing needs your attention</h2>
          <p className="max-w-sm text-slate-600">
            Every vehicle is up to date on registration, insurance, maintenance, and
            weekly mileage — and there are no open issues. That&apos;s good news.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="headline text-2xl">What needs your attention</h1>
        <span className="text-sm font-semibold text-slate-500">
          {d.counts.total} item{d.counts.total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Expirations */}
        {d.expiry.length > 0 ? (
          <AlertCard icon={ShieldAlert} title="Registration & insurance" count={d.expiry.length} tone="bad">
            <ul className="space-y-2">
              {d.expiry.map((e) => (
                <li key={`${e.vehicleId}-${e.kind}`} className="flex items-center justify-between gap-2">
                  <div>
                    <Link href={`/vehicles/${e.vehicleId}`} className="font-bold text-ink hover:text-brand">
                      {e.label}
                    </Link>
                    <p className="text-xs capitalize text-slate-500">
                      {e.kind} · {expiryDateLabel(e.date)}
                    </p>
                  </div>
                  <StatusBadge tone={e.level === "expired" ? "bad" : "warn"}>
                    {e.level === "expired"
                      ? `Expired ${Math.abs(e.days)}d ago`
                      : `${e.days}d left`}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </AlertCard>
        ) : null}

        {/* Maintenance */}
        {d.maintenance.length > 0 ? (
          <AlertCard icon={Droplet} title="Maintenance due" count={d.maintenance.length} tone="warn">
            <ul className="space-y-2">
              {d.maintenance.map((m) => (
                <li key={`${m.vehicleId}-${m.kind}`} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {m.kind === "oil_change" ? (
                      <Droplet className="h-4 w-4 text-slate-400" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-slate-400" />
                    )}
                    <div>
                      <Link href={`/vehicles/${m.vehicleId}`} className="font-bold text-ink hover:text-brand">
                        {m.label}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {m.kind === "oil_change" ? "Oil change" : "Tire check"}
                      </p>
                    </div>
                  </div>
                  {m.state === "no_record" ? (
                    <StatusBadge tone="warn">None on record</StatusBadge>
                  ) : (
                    <StatusBadge tone="bad">
                      {formatMiles(m.milesOver)} mi over
                    </StatusBadge>
                  )}
                </li>
              ))}
            </ul>
          </AlertCard>
        ) : null}

        {/* Missed mileage */}
        {d.missed.length > 0 ? (
          <AlertCard icon={CalendarX} title="Missed weekly mileage" count={d.missed.length} tone="warn">
            <ul className="space-y-2">
              {d.missed.map((m) => (
                <li key={m.vehicleId} className="flex items-center justify-between gap-2">
                  <Link href={`/vehicles/${m.vehicleId}`} className="font-bold text-ink hover:text-brand">
                    {m.label}
                  </Link>
                  <StatusBadge tone={m.consecutive >= 2 ? "bad" : "warn"}>
                    {m.consecutive === 1
                      ? "This week"
                      : `${m.consecutive} weeks missed`}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </AlertCard>
        ) : null}

        {/* Flagged mileage */}
        {d.flaggedMileage.length > 0 ? (
          <AlertCard icon={Flag} title="Mileage to review" count={d.flaggedMileage.length} tone="warn">
            <ul className="space-y-2">
              {d.flaggedMileage.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{f.vehicleLabel}</p>
                    <p className="text-xs text-slate-500">
                      {formatMiles(f.odometer)} mi · {f.driver}
                      {f.confirmed ? " · driver confirmed" : " · not confirmed"}
                    </p>
                  </div>
                  <form action={clearFlagAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button className="btn-ghost px-3 text-sm">OK</button>
                  </form>
                </li>
              ))}
            </ul>
          </AlertCard>
        ) : null}

        {/* Open issues */}
        {d.openIssues.length > 0 ? (
          <AlertCard icon={MessageSquareWarning} title="Driver-reported issues" count={d.openIssues.length} tone="bad">
            <ul className="space-y-3">
              {d.openIssues.map((i) => (
                <li key={i.id} className="rounded-lg border border-slate-100 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-ink">
                      {i.vehicleLabel} · {i.category}
                    </p>
                    <form action={resolveIssueAction}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn-ghost px-3 text-sm">Resolve</button>
                    </form>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{i.description}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <p className="text-xs text-slate-400">Reported by {i.driver}</p>
                    {i.hasPhoto ? (
                      <Link
                        href={`/api/issue-photos/${i.id}`}
                        target="_blank"
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        View photo
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </AlertCard>
        ) : null}
      </div>
    </div>
  );
}
