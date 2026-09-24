import type Database from "better-sqlite3";
import { addDestination, listDestinations, removeDestination } from "../db/client.js";

/**
 * Doc section 14, "Multiple Destinations": the owner connects channels and
 * groups once, then picks from them every time content is published.
 */
export function registerDestination(
  db: Database.Database,
  chatId: string,
  title: string,
  type: "channel" | "group"
) {
  addDestination(db, chatId, title, type);
}

export function getDestinations(db: Database.Database) {
  return listDestinations(db);
}

export function forgetDestination(db: Database.Database, chatId: string) {
  removeDestination(db, chatId);
}
