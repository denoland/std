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
