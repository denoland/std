import type { Bot, InlineKeyboard } from "gramio";
import type Database from "better-sqlite3";
import type { ButtonInput } from "../types.js";
import { addButtons, addPostMessage, createPost } from "../db/client.js";
import { buildInlineKeyboard } from "./buttons.js";

/**
 * Publishes a piece of content to every destination chat id given.
 * Records the post, its buttons, and each resulting (chat, message) pair so
 * the owner can later update the buttons across every published copy
 * (doc section 13, "Changing a Button Later").
 */
export async function publishPost(
  bot: Bot,
  db: Database.Database,
  opts: {
    label: string;
    text: string;
    buttons: ButtonInput[];
    destinationChatIds: string[];
  }
): Promise<{ postId: number; sent: number; failed: string[] }> {
  const postId = createPost(db, opts.label, opts.text);
  if (opts.buttons.length > 0) {
    addButtons(db, postId, opts.buttons);
  }

  const replyMarkup: InlineKeyboard | undefined =
    opts.buttons.length > 0 ? buildInlineKeyboard(opts.buttons) : undefined;

  let sent = 0;
  const failed: string[] = [];

  for (const chatId of opts.destinationChatIds) {
    try {
      const message = await bot.api.sendMessage({
        chat_id: chatId,
        text: opts.text,
        reply_markup: replyMarkup,
      });
      addPostMessage(db, postId, chatId, message.message_id);
      sent++;
    } catch (err) {
      failed.push(chatId);
      console.error(`Failed to publish to ${chatId}:`, err);
    }
  }

  return { postId, sent, failed };
}
