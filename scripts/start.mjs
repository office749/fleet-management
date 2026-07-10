/**
 * Production startup for Railway.
 * Runs on every deploy, in order:
 *   1. Apply database migrations (creates/updates all tables).
 *   2. Optionally load starting data, controlled by the SEED_ON_DEPLOY variable:
 *        SEED_ON_DEPLOY=sample  -> 10 example vehicles + 2 drivers + your admin
 *        SEED_ON_DEPLOY=admin   -> just your admin account, empty fleet
 *        (unset / anything else) -> do nothing
 *      Both are safe to run repeatedly (they upsert and skip existing data), so
 *      you can leave the variable set or remove it after the first deploy.
 *   3. Start the web app.
 */
import { spawn, spawnSync } from "node:child_process";

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (r.status !== 0) {
    console.error(`Step failed (${cmd} ${args.join(" ")}). Exiting.`);
    process.exit(r.status ?? 1);
  }
}

// 1. Migrations
run("npx", ["prisma", "migrate", "deploy"]);

// 2. Optional one-time data setup
const seed = (process.env.SEED_ON_DEPLOY || "").trim().toLowerCase();
if (seed === "sample") {
  run("npx", ["tsx", "prisma/seed.ts"]);
} else if (seed === "admin") {
  run("npx", ["tsx", "prisma/bootstrap-admin.ts"]);
} else {
  console.log("SEED_ON_DEPLOY not set — skipping data load.");
}

// 3. Start Next.js in the foreground
const port = process.env.PORT || "3000";
const child = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
