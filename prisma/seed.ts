/**
 * Seed the database with a sample Llewellyn fleet so you can click around
 * immediately: 1 admin, 2 drivers, 10 vehicles, plus mileage, service, docs,
 * and one open issue — arranged so the admin dashboard shows every alert type.
 *
 * Safe to re-run: it upserts the people and only creates the sample fleet if
 * no vehicles exist yet.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { currentWeekStart, shiftWeeks } from "../lib/week";

const prisma = new PrismaClient();
const STORAGE = process.env.FILE_STORAGE_DIR || "./storage";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "office@llewellynplumbing.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";
const DRIVER_PASSWORD = "driver1234";

function dateFromNow(days: number): Date {
  const d = new Date();
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  u.setUTCDate(u.getUTCDate() + days);
  return u;
}

/** Build a tiny but valid one-page PDF (correct xref) for sample documents. */
function makePdf(text: string): Buffer {
  const objects: string[] = [];
  objects.push(`<</Type/Catalog/Pages 2 0 R>>`);
  objects.push(`<</Type/Pages/Kids[3 0 R]/Count 1>>`);
  objects.push(
    `<</Type/Page/Parent 2 0 R/MediaBox[0 0 420 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>`,
  );
  const stream = `BT /F1 16 Tf 30 120 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET`;
  objects.push(`<</Length ${stream.length}>>\nstream\n${stream}\nendstream`);
  objects.push(`<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>`);

  let pdf = `%PDF-1.4\n`;
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => (pdf += `${String(off).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

async function writeSamplePdf(name: string, text: string): Promise<string> {
  const dir = path.join(STORAGE, "documents");
  await fs.mkdir(dir, { recursive: true });
  const rel = path.join("documents", name);
  await fs.writeFile(path.join(STORAGE, rel), makePdf(text));
  return rel;
}

async function main() {
  console.log("Seeding Llewellyn Fleet…");

  // --- Admin + drivers (upsert by email) ---
  // Set the admin password on BOTH create and update so redeploys reliably apply
  // whatever SEED_ADMIN_PASSWORD says (fixes "password incorrect" after changing it).
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: { role: "admin", isActive: true, passwordHash: adminHash },
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      fullName: "Office Admin",
      role: "admin",
      passwordHash: adminHash,
    },
  });

  const mike = await prisma.user.upsert({
    where: { email: "mike@example.com" },
    update: {},
    create: {
      email: "mike@example.com",
      fullName: "Mike Reyes",
      role: "driver",
      phone: "(801) 555-0111",
      passwordHash: await bcrypt.hash(DRIVER_PASSWORD, 10),
    },
  });

  const sara = await prisma.user.upsert({
    where: { email: "sara@example.com" },
    update: {},
    create: {
      email: "sara@example.com",
      fullName: "Sara Nguyen",
      role: "driver",
      phone: "(801) 555-0122",
      passwordHash: await bcrypt.hash(DRIVER_PASSWORD, 10),
    },
  });

  if ((await prisma.vehicle.count()) > 0) {
    console.log("Vehicles already exist — skipping sample fleet. Done.");
    return;
  }

  // --- 10 vehicles ---
  // VINs are valid (17 chars, no I/O/Q). Expirations chosen to exercise alerts.
  const defs = [
    { label: "Truck 1", year: 2019, make: "Ford", model: "F-250", vin: "1FTBF2B69KEC12345", base: 84000, reg: -5, ins: 200 },
    { label: "Truck 2", year: 2020, make: "Ram", model: "2500", vin: "3C6UR5DL2LG123456", base: 61000, reg: 300, ins: 12 },
    { label: "Truck 3", year: 2018, make: "Chevrolet", model: "Silverado", vin: "3GCUKREC5JG234567", base: 97000, reg: 25, ins: 250 },
    { label: "Truck 4", year: 2021, make: "Ford", model: "F-150", vin: "1FTFW1E52MFA34567", base: 42000, reg: 210, ins: 180 },
    { label: "Truck 5", year: 2017, make: "GMC", model: "Sierra", vin: "1GTV2MEC5HZ345678", base: 118000, reg: 150, ins: 160 },
    { label: "Truck 6", year: 2022, make: "Ram", model: "1500", vin: "1C6RR7GT4NS456789", base: 30000, reg: 330, ins: 300 },
    { label: "Truck 7", year: 2016, make: "Ford", model: "F-350", vin: "1FT8W3BT5GEA56789", base: 132000, reg: 240, ins: 220 },
    { label: "Truck 8", year: 2020, make: "Toyota", model: "Tundra", vin: "5TFDY5F14LX567890", base: 58000, reg: 280, ins: 210, status: "in_shop" as const },
    { label: "Van 1", year: 2021, make: "Mercedes", model: "Sprinter", vin: "WD4PF1CD5KP678901", base: 47000, reg: 190, ins: 175 },
    { label: "Van 2", year: 2014, make: "Ford", model: "Transit", vin: "1FTYE1YM5EKB78901", base: 210000, reg: 90, ins: 90, status: "retired" as const },
  ];

  const created: { id: string; label: string; base: number; status: string }[] = [];
  for (const d of defs) {
    const v = await prisma.vehicle.create({
      data: {
        label: d.label,
        year: d.year,
        make: d.make,
        model: d.model,
        vin: d.vin,
        licensePlate: `LP${1000 + created.length}`,
        plateState: "UT",
        status: (d as { status?: "active" | "in_shop" | "retired" }).status ?? "active",
        registrationExpiration: dateFromNow(d.reg),
        insuranceExpiration: dateFromNow(d.ins),
        insuranceCarrier: "Bear River Mutual",
        insurancePolicyNumber: `BRM-${20000 + created.length}`,
      },
    });
    created.push({ id: v.id, label: v.label, base: d.base, status: v.status });
  }

  const byLabel = (l: string) => created.find((c) => c.label === l)!;

  // --- Assignments ---
  await prisma.vehicleAssignment.create({ data: { vehicleId: byLabel("Truck 1").id, driverId: mike.id } });
  await prisma.vehicleAssignment.create({ data: { vehicleId: byLabel("Truck 2").id, driverId: sara.id } });

  // --- Mileage history ---
  // Give 4 weeks of readings. Skip the current week for a couple of vehicles to
  // trigger "missed mileage", and skip the last two for one (consecutive misses).
  const week0 = currentWeekStart();
  const missedThisWeek = new Set(["Truck 4"]);
  const missedTwoWeeks = new Set(["Truck 5"]);
  const latestOdo = new Map<string, number>();

  for (const v of created) {
    if (v.status === "retired") continue;
    const inc = 900 + (v.base % 500);
    for (let w = 3; w >= 0; w--) {
      if (w === 0 && (missedThisWeek.has(v.label) || missedTwoWeeks.has(v.label))) continue;
      if (w === 1 && missedTwoWeeks.has(v.label)) continue;
      const odo = v.base + (3 - w) * inc;
      if (w === 0 || (!latestOdo.has(v.label))) latestOdo.set(v.label, odo);
      await prisma.mileageLog.create({
        data: {
          vehicleId: v.id,
          weekStart: shiftWeeks(week0, -w),
          odometer: odo,
          enteredById: v.label === "Truck 2" ? sara.id : v.label === "Truck 1" ? mike.id : admin.id,
        },
      });
    }
  }
  // Ensure latestOdo reflects the true latest for each vehicle.
  for (const v of created) {
    if (v.status === "retired") continue;
    const last = await prisma.mileageLog.findFirst({
      where: { vehicleId: v.id },
      orderBy: { weekStart: "desc" },
    });
    if (last) latestOdo.set(v.label, last.odometer);
  }

  // --- Service records ---
  // Most active vehicles get a recent oil change (NOT due) + a tire rotation.
  // Truck 1 gets an OLD oil change (=> oil due). Truck 6 gets NO oil change
  // (=> "no oil change on record"). Truck 7 gets NO tire service (=> tire none).
  for (const v of created) {
    if (v.status === "retired" || v.status === "in_shop") continue;
    const odo = latestOdo.get(v.label) ?? v.base;

    if (v.label !== "Truck 6") {
      const milesAgo = v.label === "Truck 1" ? 6200 : 1500 + (v.base % 2500);
      await prisma.serviceRecord.create({
        data: {
          vehicleId: v.id,
          serviceDate: dateFromNow(-Math.max(20, milesAgo / 40)),
          type: "oil_change",
          odometer: odo - milesAgo,
          vendor: "Jiffy Lube",
          costCents: 6499 + (v.base % 1500),
          createdById: admin.id,
        },
      });
    }
    if (v.label !== "Truck 7") {
      await prisma.serviceRecord.create({
        data: {
          vehicleId: v.id,
          serviceDate: dateFromNow(-120),
          type: "tires",
          odometer: odo - 12000,
          vendor: "Discount Tire",
          costCents: 78000 + (v.base % 4000),
          createdById: admin.id,
        },
      });
    }
  }
  // A repair with a receipt-less record for cost totals.
  await prisma.serviceRecord.create({
    data: {
      vehicleId: byLabel("Truck 3").id,
      serviceDate: dateFromNow(-40),
      type: "brakes",
      odometer: (latestOdo.get("Truck 3") ?? 97000) - 3000,
      vendor: "Larry H. Miller",
      costCents: 42000,
      notes: "Front pads + rotors",
      createdById: admin.id,
    },
  });

  // --- Documents (with real sample PDFs so the viewer works) ---
  const insPath = await writeSamplePdf(
    `seed-insurance-${byLabel("Truck 1").id}.pdf`,
    "Llewellyn Plumbing - Insurance Card (SAMPLE)",
  );
  const regPath = await writeSamplePdf(
    `seed-registration-${byLabel("Truck 1").id}.pdf`,
    "Llewellyn Plumbing - Vehicle Registration (SAMPLE)",
  );
  await prisma.document.createMany({
    data: [
      {
        vehicleId: byLabel("Truck 1").id,
        docType: "insurance",
        fileName: "insurance-card.pdf",
        filePath: insPath,
        mimeType: "application/pdf",
        expirationDate: dateFromNow(200),
        uploadedById: admin.id,
      },
      {
        vehicleId: byLabel("Truck 1").id,
        docType: "registration",
        fileName: "registration.pdf",
        filePath: regPath,
        mimeType: "application/pdf",
        expirationDate: dateFromNow(-5),
        uploadedById: admin.id,
      },
    ],
  });

  // --- One open driver-reported issue ---
  await prisma.issue.create({
    data: {
      vehicleId: byLabel("Truck 1").id,
      reportedById: mike.id,
      category: "Warning light",
      description: "Check engine light came on this morning near the shop.",
    },
  });

  console.log("Seed complete.");
  console.log("--------------------------------------------------");
  console.log(`Admin login:   ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
  console.log(`Driver login:  mike@example.com  /  ${DRIVER_PASSWORD}   (Truck 1)`);
  console.log(`Driver login:  sara@example.com  /  ${DRIVER_PASSWORD}   (Truck 2)`);
  console.log("--------------------------------------------------");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
