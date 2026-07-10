import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const records = await prisma.serviceRecord.findMany({
    orderBy: [{ serviceDate: "desc" }],
    include: { vehicle: { select: { label: true } } },
  });

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const csv = toCsv(
    ["Vehicle", "Date", "Type", "Odometer", "Vendor", "Cost (USD)", "Notes"],
    records.map((r) => [
      r.vehicle.label,
      iso(r.serviceDate),
      SERVICE_TYPE_LABELS[r.type] ?? r.type,
      r.odometer ?? "",
      r.vendor ?? "",
      r.costCents != null ? (r.costCents / 100).toFixed(2) : "",
      r.notes ?? "",
    ]),
  );

  return csvResponse(`service-history-${iso(new Date())}.csv`, csv);
}
