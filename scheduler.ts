import type { Bot } from "gramio";
import type Database from "better-sqlite3";
import { runDueSchedules } from "./features/schedule.js";

/**
 * Doc section 15/24, "Scheduled Publishing": the system wakes up on its
 * own, checks what needs to happen, and publishes it - the owner doesn't
 * need to be online at the scheduled time.
 */
export function startScheduler(bot: Bot, db: Database.Database, intervalMs = 30_000) {
  const tick = async () => {
    try {
      const count = await runDueSchedules(bot, db);
      if (count > 0) console.log(`Published ${count} scheduled post(s).`);
    } catch (err) {
      console.error("Scheduler tick failed:", err);
    }
  };

  const timer = setInterval(tick, intervalMs);
  tick(); // also check immediately on startup
  return () => clearInterval(timer);
}
