import { Bot, InlineKeyboard, format, bold } from "gramio";
import { autoAnswerCallbackQuery } from "@gramio/auto-answer-callback-query";
import type Database from "better-sqlite3";
import type { Env, ButtonInput, OwnerStep } from "./types.js";
import { clearState, getState, listRecentPosts, setState } from "./db/client.js";
import {
  accessDecisionKeyboard,
  destinationPickerKeyboard,
  ownerMenuKeyboard,
} from "./keyboards.js";
import { publishPost } from "./features/publish.js";
import { getButtons } from "./db/client.js";
import { updateButtonEverywhere } from "./features/buttons.js";
import { getUpcomingSchedule, schedulePost } from "./features/schedule.js";
import {
  approve,
  decline,
  hasPendingRequest,
  isApproved,
  pendingRequests,
  requestAccess,
} from "./features/access.js";
import { getDestinations, registerDestination } from "./features/destinations.js";
import { answerBusinessQuestion, extractMention } from "./features/groupMention.js";

interface StateData {
  text?: string;
  buttons?: ButtonInput[];
  pendingLabel?: string;
  selectedDestinations?: string[];
  editPostId?: number;
  editButtonId?: number;
}

function loadState(db: Database.Database, userId: string): { step: OwnerStep; data: StateData } {
  const row = getState(db, userId);
  if (!row) return { step: "idle", data: {} };
  return { step: row.step as OwnerStep, data: JSON.parse(row.data_json) as StateData };
}

function saveState(db: Database.Database, userId: string, step: OwnerStep, data: StateData) {
  setState(db, userId, step, data);
}

/** Parses simple schedule time input: "YYYY-MM-DD HH:mm" or "+30m" / "+2h" / "+1d". */
function parseScheduleTime(input: string): Date | null {
  const trimmed = input.trim();
  const relative = trimmed.match(/^\+(\d+)([mhd])$/i);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const ms = unit === "m" ? amount * 60_000 : unit === "h" ? amount * 3_600_000 : amount * 86_400_000;
    return new Date(Date.now() + ms);
  }
  const absolute = new Date(trimmed.replace(" ", "T"));
  if (!isNaN(absolute.getTime())) return absolute;
  return null;
}

export function createBot(env: Env, db: Database.Database) {
  const bot = new Bot(env.BOT_TOKEN).extend(autoAnswerCallbackQuery());
  const isOwner = (userId: number | string) => String(userId) === String(env.OWNER_ID);

  // -------------------------------------------------------------------
  // Owner: entry points
  // -------------------------------------------------------------------
  bot.command("start", async (context) => {
    if (!context.from) return;
    if (isOwner(context.from.id)) {
      clearState(db, String(context.from.id));
      return context.send(
        format`${bold("Telegram-Bot Control Center")}\nWhat would you like to do?`,
        { reply_markup: ownerMenuKeyboard() }
      );
    }
    // Non-owner private chat: business assistance / access flow (doc section 6 & 9)
    return handleUserGreeting(context.from.id, context.from.username, (text, kb) =>
      context.send(text, kb ? { reply_markup: kb } : undefined)
    );
  });

  bot.command("menu", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    clearState(db, String(context.from.id));
    return context.send("Control Center:", { reply_markup: ownerMenuKeyboard() });
  });

  // Owner runs this inside a group they've made the bot an admin of, to
  // connect it as a publishing destination (doc section 14).
  bot.command("addhere", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    if (context.chat.type !== "group" && context.chat.type !== "supergroup") {
      return context.send("Run /addhere inside the group you want to connect.");
    }
    registerDestination(db, String(context.chat.id), context.chat.title ?? "Untitled group", "group");
    return context.send("✅ This group is now a connected destination.");
  });

  // Auto-registers channels/groups the moment the bot is promoted to admin.
  bot.on("my_chat_member", async (context) => {
    const update = context.payload;
    const newStatus = update.new_chat_member?.status;
    if (newStatus !== "administrator") return;
    const chat = update.chat;
    const type = chat.type === "channel" ? "channel" : "group";
    registerDestination(db, String(chat.id), chat.title ?? "Untitled", type);
    try {
      await bot.api.sendMessage({
        chat_id: env.OWNER_ID,
        text: `✅ Connected new destination: "${chat.title ?? chat.id}" (${type}).`,
      });
    } catch {
      /* owner may not have started a DM with the bot yet */
    }
  });

  // -------------------------------------------------------------------
  // Owner: main menu callbacks
  // -------------------------------------------------------------------
  bot.callbackQuery("menu:publish", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    saveState(db, String(context.from.id), "compose_post_text", {});
    return context.editText("Send me the text for your post.");
  });

  bot.callbackQuery("menu:schedule", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    saveState(db, String(context.from.id), "compose_post_text", { pendingLabel: "schedule" });
    return context.editText("Send me the text for the post you want to schedule.");
  });

  bot.callbackQuery("menu:destinations", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const dests = getDestinations(db);
    const list = dests.length
      ? dests.map((d) => `• ${d.title} (${d.type})`).join("\n")
      : "No destinations connected yet.";
    return context.editText(
      `${list}\n\nTo connect a new group: add the bot as admin, then run /addhere inside it.\nTo connect a channel: make the bot an admin of the channel - it will be added automatically.`,
      { reply_markup: new InlineKeyboard().text("⬅ Back", "menu:back") }
    );
  });

  bot.callbackQuery("menu:access", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const pending = pendingRequests(db);
    if (pending.length === 0) {
      return context.editText("No pending access requests.", {
        reply_markup: new InlineKeyboard().text("⬅ Back", "menu:back"),
      });
    }
    for (const user of pending) {
      await context.send(`Access request from ${user.username ? "@" + user.username : user.user_id}`, {
        reply_markup: accessDecisionKeyboard(user.user_id),
      });
    }
    return context.answer();
  });

  bot.callbackQuery("menu:edit_buttons", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const posts = listRecentPosts(db, 10).filter((p) => getButtons(db, p.id).length > 0);
    if (posts.length === 0) {
      return context.editText("No published posts with buttons yet.", {
        reply_markup: new InlineKeyboard().text("⬅ Back", "menu:back"),
      });
    }
    const kb = new InlineKeyboard();
    posts.forEach((p) => {
      kb.text(p.label.slice(0, 30) || `Post #${p.id}`, `edit_post:${p.id}`);
      kb.row();
    });
    kb.text("⬅ Back", "menu:back");
    saveState(db, String(context.from.id), "edit_button_pick_post", {});
    return context.editText("Pick a post to update its button(s):", { reply_markup: kb });
  });

  bot.callbackQuery("menu:settings", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const upcoming = getUpcomingSchedule(db);
    return context.editText(
      `Owner: ${env.OWNER_ID}\nUpcoming scheduled posts: ${upcoming.length}`,
      { reply_markup: new InlineKeyboard().text("⬅ Back", "menu:back") }
    );
  });

  bot.callbackQuery("menu:back", async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    clearState(db, String(context.from.id));
    return context.editText("Control Center:", { reply_markup: ownerMenuKeyboard() });
  });

  bot.callbackQuery("cancel", async (context) => {
    if (!context.from) return;
    clearState(db, String(context.from.id));
    if (isOwner(context.from.id)) {
      return context.editText("Cancelled. Control Center:", { reply_markup: ownerMenuKeyboard() });
    }
    return context.editText("Cancelled.");
  });

  // -------------------------------------------------------------------
  // Compose flow: destination picking (shared by Publish + Schedule)
  // -------------------------------------------------------------------
  bot.callbackQuery(/^dest_toggle:(.+)$/, async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const chatId = context.queryData[1];
    const { step, data } = loadState(db, String(context.from.id));
    if (step !== "compose_post_pick_destinations") return;
    const selected = new Set(data.selectedDestinations ?? []);
    selected.has(chatId) ? selected.delete(chatId) : selected.add(chatId);
    data.selectedDestinations = [...selected];
    saveState(db, String(context.from.id), step, data);
    const dests = getDestinations(db);
    return context.editText("Choose where to publish:", {
      reply_markup: destinationPickerKeyboard(dests, selected),
    });
  });

  bot.callbackQuery("dest_done", async (context) => {
    if (!context.from) return;
    const userId = String(context.from.id);
    const { data } = loadState(db, userId);
    const destinations = data.selectedDestinations ?? [];
    if (destinations.length === 0) {
      return context.answer({ text: "Pick at least one destination first.", show_alert: true });
    }
    if (data.pendingLabel === "schedule") {
      saveState(db, userId, "schedule_pick_time", data);
      return context.editText(
        "When should this publish? Send a date/time like `2026-09-20 10:00`, or a relative time like `+30m`, `+2h`, `+1d`."
      );
    }
    // Immediate publish
    const result = await publishPost(bot, db, {
      label: (data.text ?? "").slice(0, 40) || "Untitled post",
      text: data.text ?? "",
      buttons: data.buttons ?? [],
      destinationChatIds: destinations,
    });
    clearState(db, userId);
    const failedNote = result.failed.length ? `\n⚠ Failed: ${result.failed.join(", ")}` : "";
    return context.editText(
      `✅ Published to ${result.sent} destination(s).${failedNote}`,
      { reply_markup: ownerMenuKeyboard() }
    );
  });

  // -------------------------------------------------------------------
  // Edit-buttons flow
  // -------------------------------------------------------------------
  bot.callbackQuery(/^edit_post:(\d+)$/, async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const postId = Number(context.queryData[1]);
    const buttons = getButtons(db, postId);
    const kb = new InlineKeyboard();
    buttons.forEach((b) => kb.text(`${b.label} → ${b.url}`, `edit_button:${b.id}:${postId}`).row());
    kb.text("⬅ Back", "menu:edit_buttons");
    saveState(db, String(context.from.id), "edit_button_pick_button", { editPostId: postId });
    return context.editText("Pick a button to update:", { reply_markup: kb });
  });

  bot.callbackQuery(/^edit_button:(\d+):(\d+)$/, async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const buttonId = Number(context.queryData[1]);
    const postId = Number(context.queryData[2]);
    saveState(db, String(context.from.id), "edit_button_new_url", {
      editButtonId: buttonId,
      editPostId: postId,
    });
    return context.editText("Send the new URL for this button.");
  });

  // -------------------------------------------------------------------
  // Access-request decisions
  // -------------------------------------------------------------------
  bot.callbackQuery(/^access_approve:(.+)$/, async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const userId = context.queryData[1];
    approve(db, userId);
    await bot.api
      .sendMessage({ chat_id: userId, text: "✅ You've been approved! Send me a message any time." })
      .catch(() => {});
    return context.editText("Approved.");
  });

  bot.callbackQuery(/^access_decline:(.+)$/, async (context) => {
    if (!context.from || !isOwner(context.from.id)) return;
    const userId = context.queryData[1];
    decline(db, userId);
    await bot.api
      .sendMessage({ chat_id: userId, text: "Your access request was declined." })
      .catch(() => {});
    return context.editText("Declined.");
  });

  // -------------------------------------------------------------------
  // Free-text handling: drives the owner's multi-step workflows, and
  // provides business assistance / access requests for normal users
  // (doc sections 6, 9, 10, 25-26).
  // -------------------------------------------------------------------
  bot.on("message", async (context) => {
    if (!context.from || !context.text) return;
    const userId = String(context.from.id);
    const text = context.text.trim();
    if (text.startsWith("/")) return; // commands are handled above

    // Group mention assistance (doc section 7 & 17) - only reacts when
    // the bot is specifically @mentioned in a group/supergroup.
    if (context.chat.type === "group" || context.chat.type === "supergroup") {
      const me = await bot.api.getMe();
      if (me.username) {
        const query = extractMention(text, me.username);
        if (query !== null) {
          return context.send(answerBusinessQuestion(query));
        }
      }
      return; // ignore ordinary group chatter
    }

    // -------------------- Owner multi-step workflows --------------------
    if (isOwner(context.from.id)) {
      const { step, data } = loadState(db, userId);

      if (step === "compose_post_text") {
        data.text = text;
        saveState(db, userId, "compose_post_button_label", data);
        return context.send(
          "Send a button label to attach (e.g. `Visit Website`), or /skip to continue without buttons."
        );
      }

      if (step === "compose_post_button_label") {
        if (text === "/skip" || text === "/done") {
          saveState(db, userId, "compose_post_pick_destinations", data);
          const dests = getDestinations(db);
          if (dests.length === 0) {
            clearState(db, userId);
            return context.send(
              "No destinations connected yet. Add the bot as admin to a channel/group first."
            );
          }
          return context.send("Choose where to publish:", {
            reply_markup: destinationPickerKeyboard(dests, new Set()),
          });
        }
        data.pendingLabel = text;
        saveState(db, userId, "compose_post_button_url", data);
        return context.send(`Send the URL for the "${text}" button.`);
      }

      if (step === "compose_post_button_url") {
        const buttons = data.buttons ?? [];
        buttons.push({ label: data.pendingLabel ?? "Button", url: text });
        data.buttons = buttons;
        data.pendingLabel = undefined;
        saveState(db, userId, "compose_post_button_label", data);
        return context.send('Add another button label, or /done to continue.');
      }

      if (step === "schedule_pick_time") {
        const when = parseScheduleTime(text);
        if (!when || when.getTime() < Date.now()) {
          return context.send(
            "I couldn't understand that time, or it's in the past. Try `2026-09-20 10:00` or `+30m`."
          );
        }
        schedulePost(db, data.text ?? "", data.buttons ?? [], data.selectedDestinations ?? [], when);
        clearState(db, userId);
        return context.send(`⏰ Scheduled for ${when.toLocaleString()}.`, {
          reply_markup: ownerMenuKeyboard(),
        });
      }

      if (step === "edit_button_new_url") {
        if (data.editButtonId == null || data.editPostId == null) {
          clearState(db, userId);
          return context.send("Something went wrong - please start over from the menu.");
        }
        const result = await updateButtonEverywhere(bot, db, data.editButtonId, text, data.editPostId);
        clearState(db, userId);
        return context.send(
          `✅ Button updated on ${result.updated} message(s).${result.failed ? ` ⚠ ${result.failed} failed.` : ""}`,
          { reply_markup: ownerMenuKeyboard() }
        );
      }

      // No active workflow - show the menu.
      return context.send("Control Center:", { reply_markup: ownerMenuKeyboard() });
    }

    // -------------------- Normal users (private chat) --------------------
    return handleUserMessage(userId, context.from.username, text, (reply, kb) =>
      context.send(reply, kb ? { reply_markup: kb } : undefined)
    );
  });

  // Shared logic for a brand-new /start from a non-owner.
  async function handleUserGreeting(
    userId: number | string,
    username: string | undefined,
    send: (text: string, kb?: InlineKeyboard) => Promise<unknown>
  ) {
    const id = String(userId);
    if (isApproved(db, id)) {
      return send("Hi! How can I help you today?");
    }
    if (hasPendingRequest(db, id)) {
      return send("Your access request is still pending. We'll let you know once it's approved.");
    }
    requestAccess(db, id, username);
    await notifyOwnerOfRequest(id, username);
    return send("Thanks! Your access request has been sent to the owner for approval.");
  }

  // Shared logic for any subsequent free-text message from a non-owner.
  async function handleUserMessage(
    userId: string,
    username: string | undefined,
    text: string,
    send: (text: string, kb?: InlineKeyboard) => Promise<unknown>
  ) {
    if (isApproved(db, userId)) {
      return send(answerBusinessQuestion(text));
    }
    if (hasPendingRequest(db, userId)) {
      return send("Your access request is still pending approval.");
    }
    requestAccess(db, userId, username);
    await notifyOwnerOfRequest(userId, username);
    return send("Thanks! Your access request has been sent to the owner for approval.");
  }

  async function notifyOwnerOfRequest(userId: string, username?: string) {
    try {
      await bot.api.sendMessage({
        chat_id: env.OWNER_ID,
        text: `New access request from ${username ? "@" + username : userId}`,
        reply_markup: accessDecisionKeyboard(userId),
      });
    } catch (err) {
      console.error("Could not notify owner of access request:", err);
    }
  }

  bot.onStart(({ info }) => {
    console.log(`Telegram-Bot is running as @${info.username}`);
  });

  return bot;
}
