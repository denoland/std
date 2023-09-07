// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { difference } from "std/datetime/difference.ts";

/**
 * Returns a pluralized string for the given amount and unit.
 *
 * @example
 * ```ts
 * import { pluralize } from "@/utils/display.ts";
 *
 * pluralize(0, "meow"); // Returns "0 meows"
 * pluralize(1, "meow"); // Returns "1 meow"
 * pluralize(2, "meow"); // Returns "2 meows"
 * ```
 */
export function pluralize(amount: number, unit: string) {
  return amount === 1 ? `${amount} ${unit}` : `${amount} ${unit}s`;
}

/**
 * Returns how long ago a given date is from now.
 *
 * @example
 * ```ts
 * import { timeAgo } from "@/utils/display.ts";
 * import { SECOND, MINUTE, HOUR } from "std/datetime/constants.ts";
 *
 * timeAgo(new Date()); // Returns "just now"
 * timeAgo(new Date(Date.now() - MINUTE)); // Returns "2 minutes ago"
 * timeAgo(new Date(Date.now() - 3 * HOUR)); // Returns "3 hours ago"
 * ```
 */
export function timeAgo(date: Date) {
  const now = new Date();
  if (date > now) throw new Error("Timestamp must be in the past");
  const match = Object.entries(
    difference(now, date, {
      // These units make sense for a web UI
      units: [
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "years",
      ],
    }),
  )
    .toReversed()
    .find(([_, amount]) => amount > 0);
  if (match === undefined) return "just now";
  const [unit, amount] = match;
  // Remove the last character which is an "s"
  return pluralize(amount, unit.slice(0, -1)) + " ago";
}

export function formatAmountForDisplay(
  amount: number,
  currency: string,
): string {
  const numberFormat = new Intl.NumberFormat(
    navigator.language,
    {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      maximumFractionDigits: 0,
    },
  );
  return numberFormat.format(amount);
}
