# Telegram-Bot (GramIO edition)

An owner-controlled Telegram business automation bot, built with
[GramIO](https://gramio.dev). Implements the system described in the
Telegram-Bot spec: publishing, editable buttons, scheduling, connected
destinations, access-controlled users, and group-mention assistance.

> **A note on the tech stack.** The original spec frames Cloudflare Workers
> as the bot's "operating engine." This package instead ships as a small,
> long-running Node.js process (GramIO's official, guaranteed-stable
> long-polling mode) with a local SQLite database. This was a deliberate
> choice: GramIO's Cloudflare Workers webhook wiring isn't something I could
> verify works correctly, and shipping unverified glue code for your bot's
> deployment path is worse than shipping something that's simple and
> definitely works. This runs happily on a $5 VPS, Fly.io, Railway, Render,
> or in a Docker container — anywhere a Node process can stay alive. If you
> specifically need Workers + D1, the `src/db/client.ts` functions are a
> thin, swappable layer — see "Porting to Cloudflare Workers" below.

## What it does

| Feature | Where |
|---|---|
| Owner control-center menu | `src/bot.ts`, `src/keyboards.ts` |
| Publish to one or many destinations | `src/features/publish.ts` |
| Buttons you can re-point after publishing | `src/features/buttons.ts` |
| Scheduled posts (published automatically) | `src/features/schedule.ts`, `src/scheduler.ts` |
| Connected channels/groups | `src/features/destinations.ts` |
| Approval-based access requests | `src/features/access.ts` |
| Group @mention assistance | `src/features/groupMention.ts` |
| Persistent + ephemeral state | `src/db/schema.sql`, `src/db/client.ts` |

## Setup

1. **Create the bot.** Message [@BotFather](https://t.me/BotFather) on
   Telegram, run `/newbot`, and copy the token it gives you.
2. **Find your Telegram user id.** Message
   [@userinfobot](https://t.me/userinfobot) — this is your `OWNER_ID`.
3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # then edit .env with your BOT_TOKEN and OWNER_ID
   ```
4. Pick a runtime and follow the matching section below.

The same `src/` code runs unmodified on either runtime — `deno.json`
provides an import map so bare specifiers like `"gramio"` resolve to
`npm:gramio` under Deno, exactly like `package.json` resolves them under
Node.

### Option A — Node.js

Requires Node **20.6+** (for the native `--env-file` flag).

```bash
npm install
npm run db:init     # optional - also happens automatically on first run
npm run dev          # hot-reloading, for development
# or
npm run build && npm start   # production
```

### Option B — Deno

Requires Deno **1.44+** (for the native `--env-file` flag). No `npm install`
step needed — Deno fetches `npm:gramio`, `npm:better-sqlite3`, etc. on first
run per the import map in `deno.json`.

```bash
deno task db:init   # optional - also happens automatically on first run
deno task dev        # hot-reloading, for development
# or
deno task start       # production
```

`better-sqlite3` is a native addon; Deno's npm compatibility layer supports
it, but if your Deno version has trouble with native modules, swap
`src/db/init.ts` and `src/db/client.ts` for a Deno-native driver such as
`jsr:@db/sqlite` — same SQL, same `schema.sql`, just a different
`.prepare()/.run()/.all()` wrapper.

Once it's running (either runtime), message your bot on Telegram from the
`OWNER_ID` account and send `/start` to see the control center.

## Using it as the owner

- `/start` or `/menu` — open the control center
- **📢 Publish** — compose text, optionally attach buttons, pick destinations,
  and it goes out immediately
- **⏰ Schedule** — same flow, but you give it a future time
  (`2026-09-20 10:00`, or relative like `+30m`, `+2h`, `+1d`)
- **🔗 Edit Buttons** — pick a previously published post and re-point one of
  its buttons; every message it was published to gets updated in place
- **📣 Destinations** — see connected channels/groups. To connect a new one:
  make the bot an admin there (channels register automatically; in groups,
  also run `/addhere`)
- **👥 Access Requests** — approve or decline people who've messaged the bot

## Using it as a normal user

Anyone else who messages the bot privately gets a friendly greeting. If
they're not yet approved, an access request is sent to the owner
automatically; once approved, their messages get a business-assistant reply
(see `answerBusinessQuestion` in `src/features/groupMention.ts` — replace
this with your own FAQ/catalog logic or an LLM call as needed).

## Using it in a group

The bot ignores ordinary group chatter. When someone writes
`@YourBotUsername <question>`, it recognizes the mention and replies.

## Data & privacy

Persistent data (destinations, posts, buttons, schedules, access decisions)
lives in `data/bot.sqlite`. Multi-step conversation state (e.g. "I'm
composing a post and I'm on step 2") is kept in the `user_state` table and
is meant to be treated as temporary/expiring, per the bot's privacy
principle — nothing about it needs backing up.

## Porting to Cloudflare Workers

The database layer (`src/db/client.ts`) only touches a `better-sqlite3`
instance through plain SQL — no Node-specific APIs beyond that. To port to
Workers + D1:

1. Swap `src/db/init.ts` and `src/db/client.ts` for D1's `async` query API
   (`db.prepare(sql).bind(...).run()/.all()/.first()` — same SQL, same
   `schema.sql`, since D1 is SQLite under the hood).
2. Replace `bot.start()` long-polling in `src/index.ts` with a `fetch`
   handler that parses the incoming Telegram update and feeds it into
   GramIO's update pipeline via whatever webhook adapter your installed
   GramIO version documents (check `node_modules/gramio`'s README for the
   current list of supported frameworks/adapters — this changes between
   versions, so it's worth confirming against your installed version rather
   than trusting older docs).
3. Replace `src/scheduler.ts`'s `setInterval` with a Workers **Cron
   Trigger** that calls the same `runDueSchedules` function.

Everything in `src/features/*` is framework-agnostic and can be reused as-is.
