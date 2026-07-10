import { Download, FileSpreadsheet } from "lucide-react";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="headline mb-1 text-2xl">Export data</h1>
      <p className="mb-6 text-slate-600">
        Download spreadsheets for your accountant. Files open in Excel, Numbers, or
        Google Sheets.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/api/export/mileage"
          className="card flex items-center gap-4 p-5 transition hover:border-brand"
        >
          <FileSpreadsheet className="h-10 w-10 text-brand" />
          <div className="flex-1">
            <p className="text-lg font-extrabold text-ink">Mileage logs</p>
            <p className="text-sm text-slate-500">Every weekly reading, all vehicles.</p>
          </div>
          <Download className="h-5 w-5 text-slate-400" />
        </a>

        <a
          href="/api/export/service"
          className="card flex items-center gap-4 p-5 transition hover:border-brand"
        >
          <FileSpreadsheet className="h-10 w-10 text-brand" />
          <div className="flex-1">
            <p className="text-lg font-extrabold text-ink">Service history</p>
            <p className="text-sm text-slate-500">All service records with costs.</p>
          </div>
          <Download className="h-5 w-5 text-slate-400" />
        </a>
      </div>
    </div>
  );
}
