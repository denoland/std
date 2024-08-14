// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * **UNSTABLE**: New API, yet to be vetted.
 *
 * Converts a string into a slug.
 *
 * @example Usage
 * ```ts
 * import { slugify } from "@std/text/slugify";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(slugify("déjà vu"),"deja-vu");
 * ```
 *
 * @param input The string that is going to be converted into a slug
 * @returns The string as a slug
 *
 * @experimental
 */
export function slugify(input: string): string {
  return input
    .trim()
    .normalize("NFD")
    .replaceAll(/[^a-zA-Z0-9\s-]/g, "")
    .replaceAll(/\s+|-+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}
