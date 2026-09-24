-- Telegram-Bot D1 schema
-- Run with: npm run db:init  (or db:init:remote for production)

-- Destinations the owner has connected (channels/groups the bot can post to)
CREATE TABLE IF NOT EXISTS destinations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       TEXT NOT NULL UNIQUE,   -- Telegram chat id (channel or group)
  title         TEXT NOT NULL,          -- friendly name shown in menus
  type          TEXT NOT NULL,          -- 'channel' | 'group'
  added_at      INTEGER NOT NULL
);

-- Published posts, so buttons can be updated later without re-publishing
CREATE TABLE IF NOT EXISTS posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  label         TEXT NOT NULL,          -- short owner-facing name, e.g. "Fall Promo"
  text          TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

-- One row per (post, destination, telegram message) so we know exactly which
-- messages to edit when a button's destination changes.
CREATE TABLE IF NOT EXISTS post_messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id       INTEGER NOT NULL REFERENCES posts(id),
  chat_id       TEXT NOT NULL,
  message_id    INTEGER NOT NULL
);

-- Buttons attached to a post. Editing a button's url here and re-applying it
-- updates every message in post_messages that used it.
CREATE TABLE IF NOT EXISTS buttons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id       INTEGER NOT NULL REFERENCES posts(id),
  label         TEXT NOT NULL,
  url           TEXT NOT NULL,
  row_order     INTEGER NOT NULL DEFAULT 0
);

-- Scheduled posts waiting to be published
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  text            TEXT NOT NULL,
  buttons_json    TEXT,                 -- JSON array of {label, url}
  destinations    TEXT NOT NULL,        -- JSON array of chat_id strings
  publish_at      INTEGER NOT NULL,     -- unix seconds
  status          TEXT NOT NULL DEFAULT 'pending', -- pending|published|failed
  created_at      INTEGER NOT NULL
);

-- Approved / declined / pending users
CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT PRIMARY KEY,
  username      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|approved|declined
  requested_at  INTEGER NOT NULL,
  decided_at    INTEGER
);

-- Short-lived per-user conversation state for multi-step owner workflows
-- (compose a post, add a button, pick destinations, etc). Treated as
-- temporary/expiring data per the bot's privacy principle.
CREATE TABLE IF NOT EXISTS user_state (
  user_id       TEXT PRIMARY KEY,
  step          TEXT NOT NULL,
  data_json     TEXT NOT NULL DEFAULT '{}',
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time
  ON scheduled_posts (status, publish_at);

CREATE INDEX IF NOT EXISTS idx_post_messages_post
  ON post_messages (post_id);

CREATE INDEX IF NOT EXISTS idx_buttons_post
  ON buttons (post_id);
