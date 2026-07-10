/**
 * Remove ONLY the demo/sample data (the 10 example vehicles and the 2 example
 * drivers), by their known identifiers. Your real vehicles, drivers, and admin
 * accounts are never touched. Safe to run repeatedly.
 *
 * Triggered by setting SEED_ON_DEPLOY=clean and redeploying.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_VINS = [
  "1FTBF2B69KEC12345",
  "3C6UR5DL2LG123456",
  "3GCUKREC5JG234567",
  "1FTFW1E52MFA34567",
  "1GTV2MEC5HZ345678",
  "1C6RR7GT4NS456789",
  "1FT8W3BT5GEA56789",
  "5TFDY5F14LX567890",
  "WD4PF1CD5KP678901",
  "1FTYE1YM5EKB78901",
];

const SAMPLE_DRIVER_EMAILS = ["mike@example.com", "sara@example.com"];

async function main() {
  // Deleting a vehicle cascades to its mileage, service, documents, and issues.
  const vehicles = await prisma.vehicle.deleteMany({
    where: { vin: { in: SAMPLE_VINS } },
  });
  const drivers = await prisma.user.deleteMany({
    where: { email: { in: SAMPLE_DRIVER_EMAILS }, role: "driver" },
  });
  console.log(
    `Removed ${vehicles.count} sample vehicles and ${drivers.count} sample drivers. Your real data is untouched.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
