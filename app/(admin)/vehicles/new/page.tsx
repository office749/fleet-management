import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listActiveDrivers } from "@/lib/data/users";
import { VehicleForm } from "@/components/vehicle-form";

export const dynamic = "force-dynamic";

export default async function NewVehiclePage() {
  await requireAdmin();
  const drivers = await listActiveDrivers();
  return (
    <div>
      <Link href="/vehicles" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to vehicles
      </Link>
      <h1 className="headline mb-5 text-2xl">Add vehicle</h1>
      <VehicleForm drivers={drivers} />
    </div>
  );
}
