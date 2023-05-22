// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export function pluralize(unit: number, label: string) {
  return unit === 1 ? `${unit} ${label}` : `${unit} ${label}s`;
}

/**
 * @todo Replace with https://deno.land/std@0.184.0/datetime/mod.ts?s=difference
 * @todo Tests
 */
export function timeAgo(time: number | Date) {
  const between = (Date.now() - Number(time)) / 1000;
  if (between < 3600) return pluralize(~~(between / 60), "minute");
  else if (between < 86400) return pluralize(~~(between / 3600), "hour");
  else return pluralize(~~(between / 86400), "day");
}
