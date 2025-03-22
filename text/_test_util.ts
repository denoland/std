// Copyright 2018-2025 the Deno authors. MIT license.
export function generateRandomString(min: number, max: number): string {
  return Array.from({ length: Math.floor(Math.random() * (max - min) + min) })
    .map(() => String.fromCharCode(Math.floor(Math.random() * 26) + 97))
    .join("");
}
