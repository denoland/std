// Copyright 2018-2025 the Deno authors. MIT license.

export function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}
