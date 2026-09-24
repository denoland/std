import { InlineKeyboard } from "gramio";
import type { Destination } from "./types.js";

/** The owner's main control-center menu (see doc section 5, "Owner Experience"). */
export function ownerMenuKeyboard() {
  return new InlineKeyboard()
    .text("📢 Publish", "menu:publish")
    .text("⏰ Schedule", "menu:schedule")
    .row()
    .text("🔗 Edit Buttons", "menu:edit_buttons")
    .text("📣 Destinations", "menu:destinations")
    .row()
    .text("👥 Access Requests", "menu:access")
    .text("⚙️ Settings", "menu:settings");
}

/** Checkbox-style destination picker used when composing/scheduling a post. */
export function destinationPickerKeyboard(
  destinations: Destination[],
  selected: Set<string>
) {
  const kb = new InlineKeyboard();
  destinations.forEach((d, i) => {
    const mark = selected.has(d.chat_id) ? "☑" : "☐";
    kb.text(`${mark} ${d.title}`, `dest_toggle:${d.chat_id}`);
    if (i % 1 === 0) kb.row();
  });
  kb.text("✅ Done", "dest_done").row().text("✖ Cancel", "cancel");
  return kb;
}

/** Simple yes/no confirmation keyboard. */
export function confirmKeyboard(yesData: string, noData = "cancel") {
  return new InlineKeyboard().text("✅ Confirm", yesData).text("✖ Cancel", noData);
}

export function accessDecisionKeyboard(userId: string) {
  return new InlineKeyboard()
    .text("✅ Approve", `access_approve:${userId}`)
    .text("🚫 Decline", `access_decline:${userId}`);
}
