// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { difference } from "std/datetime/difference.ts";

export function pluralize(unit: number, label: string) {
  return unit === 1 ? `${unit} ${label}` : `${unit} ${label}s`;
}

export function timeAgo(time: number | Date) {
  const minutes = difference(new Date(), new Date(time))?.minutes;
  if (!minutes) return pluralize(0, "minute");
  if (minutes < 60) return pluralize(~~minutes, "minute");
  else if (minutes < 24 * 60) return pluralize(~~(minutes / 60), "hour");
  else return pluralize(~~(minutes / (24 * 60)), "day");
}

/**
 * Dynamically generates styles depending on whether the given condition is truthy.
 * This is used to visually highlight a link if it matches the current page.
 *
 * @example
 * ```ts
 * import { getToggledStyles } from "@/utils/display.ts";
 *
 * // Returns "text-gray !text-black"
 * const activeLinkStyles = getToggledStyles("text-gray", "!text-black", true);
 *
 * // Returns "text-gray"
 * const inactiveLinkStyles = getToggledStyles("text-gray", "!text-black", false);
 * ```
 */
export function getToggledStyles(
  baseStyles: string,
  toggledStyles: string,
  cond: boolean,
) {
  let styles = baseStyles;
  if (cond) styles += " " + toggledStyles;
  return styles;
}
