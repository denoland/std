import type { Bot } from "gramio";
import type Database from "better-sqlite3";
import type { ButtonInput } from "../types.js";
import {
  createScheduledPost,
  getDuePosts,
  listUpcoming,
  markScheduledPost,
} from "../db/client.js";
import { publishPost } from "./publish.js";

export function schedulePost(
  db: Database.Database,
  text: string,
  buttons: ButtonInput[],
  destinationChatIds: string[],
  publishAt: Date
): number {
  return createScheduledPost(
    db,
    text,
    buttons,
    destinationChatIds,
    Math.floor(publishAt.getTime() / 1000)
  );
}

export function getUpcomingSchedule(db: Database.Database) {
  return listUpcoming(db);
}

/**
 * Publishes every scheduled post whose time has arrived (doc section 15,
 * "Scheduled Publishing"). Intended to be called on a recurring timer -
 * see src/scheduler.ts.
 */
export async function runDueSchedules(bot: Bot, db: Database.Database) {
  const due = getDuePosts(db);
  for (const post of due) {
    const buttons: ButtonInput[] = post.buttons_json ? JSON.parse(post.buttons_json) : [];
    const destinations: string[] = JSON.parse(post.destinations);
    try {
      await publishPost(bot, db, {
        label: `Scheduled #${post.id}`,
        text: post.text,
        buttons,
        destinationChatIds: destinations,
      });
      markScheduledPost(db, post.id, "published");
    } catch (err) {
      console.error(`Failed to publish scheduled post ${post.id}:`, err);
      markScheduledPost(db, post.id, "failed");
    }
  }
  return due.length;
}
