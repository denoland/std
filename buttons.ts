import { InlineKeyboard, type Bot } from "gramio";
import type Database from "better-sqlite3";
import type { ButtonInput } from "../types.js";
import { getButtons, getPostMessages, updateButtonUrl } from "../db/client.js";

/** Turns a flat list of {label, url} buttons into a one-per-row inline keyboard. */
export function buildInlineKeyboard(buttons: ButtonInput[]): InlineKeyboard {
  let kb = new InlineKeyboard();
  buttons.forEach((b, i) => {
    kb = kb.url(b.label, b.url);
    if (i < buttons.length - 1) kb = kb.row();
  });
  return kb;
}

/**
 * Changes a button's destination URL and re-applies the updated keyboard to
 * every message that post was published to (doc section 13: "Changing a
 * Button Later" - previously published messages stay current without the
 * owner recreating every post).
 */
export async function updateButtonEverywhere(
  bot: Bot,
  db: Database.Database,
  buttonId: number,
  newUrl: string,
  postId: number
): Promise<{ updated: number; failed: number }> {
  updateButtonUrl(db, buttonId, newUrl);

  const buttons = getButtons(db, postId);
  const keyboard = buildInlineKeyboard(
    buttons.map((b) => ({ label: b.label, url: b.url }))
  );
  const messages = getPostMessages(db, postId);

  let updated = 0;
  let failed = 0;
  for (const m of messages) {
    try {
      await bot.api.editMessageReplyMarkup({
        chat_id: m.chat_id,
        message_id: m.message_id,
        reply_markup: keyboard,
      });
      updated++;
    } catch (err) {
      failed++;
      console.error(`Failed to update button on ${m.chat_id}/${m.message_id}:`, err);
    }
  }
  return { updated, failed };
}
