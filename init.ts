import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnv } from "../env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function openDatabase(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
  return db;
}

// Allows `npm run db:init` / `deno task db:init` to create or upgrade the
// database file on its own, without starting the bot.
declare const Deno: { mainModule?: string } | undefined;
const isMainModule =
  typeof Deno !== "undefined"
    ? Deno.mainModule === import.meta.url
    : typeof process !== "undefined" && process.argv[1]?.endsWith("init.ts");

if (isMainModule) {
  const path = getEnv("DB_PATH") || "./data/bot.sqlite";
  openDatabase(path);
  console.log(`Database ready at ${path}`);
}
