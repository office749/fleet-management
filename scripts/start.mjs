/**
 * Production startup for Railway.
 * Runs on every deploy, in order:
 *   1. Wait for the database, then apply migrations (with retries, because
 *      Railway's private network can take a few seconds to be ready at boot).
 *   2. Optionally load starting data, controlled by SEED_ON_DEPLOY:
 *        sample -> 10 example vehicles + 2 drivers + your admin
 *        admin  -> just your admin account, empty fleet
 *   3. Start the web app (always — even if the steps above had trouble, so the
 *      site comes up and problems are visible instead of a crash loop).
 */
import { spawn, spawnSync } from "node:child_process";

function tryRun(cmd, args) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  return r.status === 0;
}

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. The app can't reach a database.");
}

// 1. Apply migrations, retrying while the private DB network comes up.
const MAX_ATTEMPTS = 12;
let migrated = false;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  console.log(`\n[startup] Applying database migrations (attempt ${attempt}/${MAX_ATTEMPTS})…`);
  if (tryRun("npx", ["prisma", "migrate", "deploy"])) {
    migrated = true;
    break;
  }
  if (attempt < MAX_ATTEMPTS) {
    console.log("[startup] Database not ready yet — waiting 5s and retrying…");
    spawnSync("node", ["-e", "setTimeout(()=>{}, 5000)"]); // simple 5s sleep
  }
}
if (!migrated) {
  console.error("[startup] Migrations did not complete. Starting the web server anyway so the site is reachable; check DATABASE_URL.");
}

// 2. Optional one-time data setup (non-fatal).
const seed = (process.env.SEED_ON_DEPLOY || "").trim().toLowerCase();
if (migrated && seed === "sample") {
  if (!tryRun("npx", ["tsx", "prisma/seed.ts"])) console.error("[startup] Seed failed (non-fatal).");
} else if (migrated && seed === "admin") {
  if (!tryRun("npx", ["tsx", "prisma/bootstrap-admin.ts"])) console.error("[startup] Admin bootstrap failed (non-fatal).");
} else if (!migrated) {
  console.log("[startup] Skipping data load because migrations didn't run.");
} else {
  console.log("[startup] SEED_ON_DEPLOY not set — skipping data load.");
}

// 3. Start Next.js in the foreground.
const port = process.env.PORT || "3000";
console.log(`\n[startup] Starting web server on port ${port}…`);
const child = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
