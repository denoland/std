// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

export function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}
