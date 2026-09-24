import type Database from "better-sqlite3";
import type {
  Destination,
  PostRecord,
  ScheduledPost,
  UserRecord,
  UserState,
  ButtonInput,
} from "../types.js";

const now = () => Math.floor(Date.now() / 1000);

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export function addDestination(
  db: Database.Database,
  chatId: string,
  title: string,
  type: "channel" | "group"
) {
  db.prepare(
    `INSERT INTO destinations (chat_id, title, type, added_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(chat_id) DO UPDATE SET title = excluded.title`
  ).run(chatId, title, type, now());
}

export function listDestinations(db: Database.Database): Destination[] {
  return db.prepare(`SELECT * FROM destinations ORDER BY added_at DESC`).all() as Destination[];
}

export function removeDestination(db: Database.Database, chatId: string) {
  db.prepare(`DELETE FROM destinations WHERE chat_id = ?`).run(chatId);
}

// ---------------------------------------------------------------------------
// Posts, messages, buttons
// ---------------------------------------------------------------------------

export function createPost(db: Database.Database, label: string, text: string): number {
  const result = db
    .prepare(`INSERT INTO posts (label, text, created_at) VALUES (?, ?, ?)`)
    .run(label, text, now());
  return Number(result.lastInsertRowid);
}

export function addPostMessage(
  db: Database.Database,
  postId: number,
  chatId: string,
  messageId: number
) {
  db.prepare(
    `INSERT INTO post_messages (post_id, chat_id, message_id) VALUES (?, ?, ?)`
  ).run(postId, chatId, messageId);
}

export function getPostMessages(db: Database.Database, postId: number) {
  return db
    .prepare(`SELECT chat_id, message_id FROM post_messages WHERE post_id = ?`)
    .all(postId) as { chat_id: string; message_id: number }[];
}

export function addButtons(db: Database.Database, postId: number, buttons: ButtonInput[]) {
  const stmt = db.prepare(
    `INSERT INTO buttons (post_id, label, url, row_order) VALUES (?, ?, ?, ?)`
  );
  buttons.forEach((b, i) => stmt.run(postId, b.label, b.url, i));
}

export function getButtons(db: Database.Database, postId: number) {
  return db
    .prepare(`SELECT * FROM buttons WHERE post_id = ? ORDER BY row_order ASC`)
    .all(postId) as { id: number; post_id: number; label: string; url: string; row_order: number }[];
}

export function updateButtonUrl(db: Database.Database, buttonId: number, url: string) {
  db.prepare(`UPDATE buttons SET url = ? WHERE id = ?`).run(url, buttonId);
}

export function listRecentPosts(db: Database.Database, limit = 10): PostRecord[] {
  return db
    .prepare(`SELECT * FROM posts ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as PostRecord[];
}

// ---------------------------------------------------------------------------
// Scheduled posts
// ---------------------------------------------------------------------------

export function createScheduledPost(
  db: Database.Database,
  text: string,
  buttons: ButtonInput[],
  destinationChatIds: string[],
  publishAt: number
): number {
  const result = db
    .prepare(
      `INSERT INTO scheduled_posts (text, buttons_json, destinations, publish_at, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`
    )
    .run(text, JSON.stringify(buttons), JSON.stringify(destinationChatIds), publishAt, now());
  return Number(result.lastInsertRowid);
}

export function getDuePosts(db: Database.Database): ScheduledPost[] {
  return db
    .prepare(
      `SELECT * FROM scheduled_posts WHERE status = 'pending' AND publish_at <= ? ORDER BY publish_at ASC LIMIT 20`
    )
    .all(now()) as ScheduledPost[];
}

export function markScheduledPost(
  db: Database.Database,
  id: number,
  status: "published" | "failed"
) {
  db.prepare(`UPDATE scheduled_posts SET status = ? WHERE id = ?`).run(status, id);
}

export function listUpcoming(db: Database.Database): ScheduledPost[] {
  return db
    .prepare(
      `SELECT * FROM scheduled_posts WHERE status = 'pending' ORDER BY publish_at ASC LIMIT 20`
    )
    .all() as ScheduledPost[];
}

// ---------------------------------------------------------------------------
// Users / access requests
// ---------------------------------------------------------------------------

export function upsertPendingUser(db: Database.Database, userId: string, username?: string) {
  db.prepare(
    `INSERT INTO users (user_id, username, status, requested_at)
     VALUES (?, ?, 'pending', ?)
     ON CONFLICT(user_id) DO UPDATE SET username = excluded.username`
  ).run(userId, username ?? null, now());
}

export function decideUser(db: Database.Database, userId: string, approve: boolean) {
  db.prepare(`UPDATE users SET status = ?, decided_at = ? WHERE user_id = ?`).run(
    approve ? "approved" : "declined",
    now(),
    userId
  );
}

export function getUser(db: Database.Database, userId: string): UserRecord | null {
  return (db.prepare(`SELECT * FROM users WHERE user_id = ?`).get(userId) as UserRecord) ?? null;
}

export function listPendingUsers(db: Database.Database): UserRecord[] {
  return db
    .prepare(`SELECT * FROM users WHERE status = 'pending' ORDER BY requested_at ASC`)
    .all() as UserRecord[];
}

// ---------------------------------------------------------------------------
// Ephemeral conversation state (multi-step owner workflows).
// Kept separate from everything else so it's obviously the "temporary" data
// described in the bot's privacy principle - safe to wipe at any time.
// ---------------------------------------------------------------------------

export function setState(
  db: Database.Database,
  userId: string,
  step: string,
  data: object = {}
) {
  db.prepare(
    `INSERT INTO user_state (user_id, step, data_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET step = excluded.step, data_json = excluded.data_json, updated_at = excluded.updated_at`
  ).run(userId, step, JSON.stringify(data), now());
}

export function getState(db: Database.Database, userId: string): UserState | null {
  return (db.prepare(`SELECT * FROM user_state WHERE user_id = ?`).get(userId) as UserState) ?? null;
}

export function clearState(db: Database.Database, userId: string) {
  db.prepare(`DELETE FROM user_state WHERE user_id = ?`).run(userId);
}
