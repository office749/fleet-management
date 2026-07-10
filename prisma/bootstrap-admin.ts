/**
 * Create (or update) your first admin account from environment variables,
 * WITHOUT any sample data. Use this instead of the full seed if you want to
 * start with an empty fleet and add your real vehicles yourself.
 *
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD control the credentials.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "office@llewellynplumbing.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    // Reset the password on every run so this doubles as a reliable
    // "reset admin password" tool (set SEED_ADMIN_PASSWORD, redeploy).
    update: { role: "admin", isActive: true, passwordHash },
    create: { email, fullName: "Office Admin", role: "admin", passwordHash },
  });
  console.log(`Admin ready: ${user.email}`);
  console.log(`Password set to the value of SEED_ADMIN_PASSWORD.`);
  console.log("Sign in, then change your password under Team, and remove SEED_ON_DEPLOY.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
