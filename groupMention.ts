/**
 * Doc section 7 & 17, "Group Experience" / "Group Assistance": the bot
 * doesn't respond to every message in a group, only when it is specifically
 * mentioned (e.g. "@TelegramBot price of Product A?").
 */
export function extractMention(text: string, botUsername: string): string | null {
  const mention = `@${botUsername}`;
  const idx = text.toLowerCase().indexOf(mention.toLowerCase());
  if (idx === -1) return null;
  return (text.slice(0, idx) + text.slice(idx + mention.length)).trim();
}

/**
 * Very small placeholder "business assistant" responder. Replace this with
 * a call to your own FAQ/catalog logic, or an LLM, as the business grows.
 */
export function answerBusinessQuestion(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("price") || q.includes("cost")) {
    return "Thanks for asking! Send me the product name and I'll get you pricing details.";
  }
  if (q.includes("hour") || q.includes("open")) {
    return "We're happy to help - let us know what you're looking for and we'll get back to you.";
  }
  if (q.length === 0) {
    return "Hi! How can I help you today?";
  }
  return `Thanks for reaching out about "${query}" - a member of our team will follow up shortly.`;
}
