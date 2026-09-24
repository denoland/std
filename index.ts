// Environment variables are loaded via the --env-file=.env flag (Node 20.6+
// and Deno 1.44+ both support this natively - see package.json / deno.json
// for the exact run commands).
import { openDatabase } from "./db/init.js";
import { createBot } from "./bot.js";
import { startScheduler } from "./scheduler.js";
import { getEnv, requireEnv } from "./env.js";
import type { Env } from "./types.js";

const env: Env = {
  BOT_TOKEN: requireEnv("BOT_TOKEN"),
  OWNER_ID: requireEnv("OWNER_ID"),
  DB_PATH: getEnv("DB_PATH") || "./data/bot.sqlite",
};

const db = openDatabase(env.DB_PATH);
const bot = createBot(env, db);

const stopScheduler = startScheduler(bot, db);

bot.start();

function shutdown() {
  console.log("\nShutting down...");
  stopScheduler();
  db.close();
}

// Deno.addSignalListener isn't available on Windows for Deno, but SIGINT/
// SIGTERM handling here is best-effort either way - both runtimes exit
// cleanly on Ctrl+C even without this.
declare const Deno: { addSignalListener?: (signal: string, handler: () => void) => void } | undefined;

if (typeof Deno !== "undefined" && Deno.addSignalListener) {
  Deno.addSignalListener("SIGINT", () => { shutdown(); (globalThis as any).Deno.exit(0); });
  Deno.addSignalListener("SIGTERM", () => { shutdown(); (globalThis as any).Deno.exit(0); });
} else {
  process.on("SIGINT", () => { shutdown(); process.exit(0); });
  process.on("SIGTERM", () => { shutdown(); process.exit(0); });
}
