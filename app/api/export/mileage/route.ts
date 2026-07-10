import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const logs = await prisma.mileageLog.findMany({
    orderBy: [{ weekStart: "desc" }, { vehicleId: "asc" }],
    include: {
      vehicle: { select: { label: true } },
      enteredBy: { select: { fullName: true } },
    },
  });

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const csv = toCsv(
    ["Vehicle", "Week starting (Mon)", "Odometer", "Entered by", "Entered at", "Flagged", "Driver confirmed"],
    logs.map((l) => [
      l.vehicle.label,
      iso(l.weekStart),
      l.odometer,
      l.enteredBy.fullName,
      l.enteredAt.toISOString(),
      l.needsReview ? "yes" : "no",
      l.driverConfirmed ? "yes" : "no",
    ]),
  );

  return csvResponse(`mileage-logs-${iso(new Date())}.csv`, csv);
}
