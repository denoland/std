// Copyright 2018-2025 the Deno authors. MIT license.
import { difference } from "@std/datetime/difference";

/**
 * Formats a given date as a relative time string (e.g., "3 minutes ago").
 *
 * @param date - The date to compare with the current time.
 * @returns A string representing the relative time difference.
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = difference(date, now);

  if (diff.years && diff.years > 0) {
    return `${diff.years} year${diff.years === 1 ? "" : "s"} ago`;
  } else if (diff.months && diff.months > 0) {
    return `${diff.months} month${diff.months === 1 ? "" : "s"} ago`;
  } else if (diff.weeks && diff.weeks > 0) {
    return `${diff.weeks} week${diff.weeks === 1 ? "" : "s"} ago`;
  } else if (diff.days && diff.days > 0) {
    return `${diff.days} day${diff.days === 1 ? "" : "s"} ago`;
  } else if (diff.hours && diff.hours > 0) {
    return `${diff.hours} hour${diff.hours === 1 ? "" : "s"} ago`;
  } else if (diff.minutes && diff.minutes > 0) {
    return `${diff.minutes} minute${diff.minutes === 1 ? "" : "s"} ago`;
  } else if (diff.seconds && diff.seconds > 0) {
    return `${diff.seconds} second${diff.seconds === 1 ? "" : "s"} ago`;
  } else {
    return "just now";
  }
}
