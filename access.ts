import type Database from "better-sqlite3";
import {
  decideUser,
  getUser,
  listPendingUsers,
  upsertPendingUser,
} from "../db/client.js";

/**
 * Doc section 9, "User Access Requests": a new person interacting with the
 * bot doesn't automatically get access to controlled features - a request
 * is created for the owner to accept or decline.
 */
export function requestAccess(db: Database.Database, userId: string, username?: string) {
  upsertPendingUser(db, userId, username);
}

export function isApproved(db: Database.Database, userId: string): boolean {
  const user = getUser(db, userId);
  return user?.status === "approved";
}

export function hasPendingRequest(db: Database.Database, userId: string): boolean {
  const user = getUser(db, userId);
  return user?.status === "pending";
}

export function approve(db: Database.Database, userId: string) {
  decideUser(db, userId, true);
}

export function decline(db: Database.Database, userId: string) {
  decideUser(db, userId, false);
}

export function pendingRequests(db: Database.Database) {
  return listPendingUsers(db);
}
