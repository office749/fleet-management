import { FileText, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { DOC_TYPE_LABELS } from "@/lib/labels";

type Doc = {
  id: string;
  docType: string;
  fileName: string;
  expirationDate: Date | null;
};

function expiryBadge(date: Date | null) {
  if (!date) return null;
  const today = new Date();
  const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const b = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const days = Math.round((b - a) / 86_400_000);
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (days < 0) return <StatusBadge tone="bad">Expired {label}</StatusBadge>;
  if (days <= 30) return <StatusBadge tone="warn">Expires {label}</StatusBadge>;
  return <StatusBadge tone="good">Valid to {label}</StatusBadge>;
}

export function DriverDocuments({ docs }: { docs: Doc[] }) {
  return (
    <section className="card p-4">
      <h2 className="headline mb-1 text-lg">My documents</h2>
      <p className="mb-3 text-sm text-slate-500">
        Tap to view. Keep these handy for a traffic stop.
      </p>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id}>
              <a
                href={`/api/files/${d.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap flex items-center gap-3 rounded-xl border-2 border-slate-200 px-3 py-2 hover:border-brand"
              >
                <FileText className="h-6 w-6 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">
                    {DOC_TYPE_LABELS[d.docType] ?? d.docType}
                  </p>
                  <div className="mt-0.5">{expiryBadge(d.expirationDate)}</div>
                </div>
                <ExternalLink className="h-5 w-5 shrink-0 text-slate-400" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
