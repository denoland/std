// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * {@linkcode parse} and {@linkcode stringify} for handling
 * {@link https://en.wikipedia.org/wiki/INI_file | INI} encoded data, such as the
 * {@link https://specifications.freedesktop.org/desktop-entry-spec/latest/ar01s03.html | Desktop Entry specification}.
 *
 * ```ts
 * import { parse, stringify } from "@std/ini";
 * import { assertEquals } from "@std/assert";
 *
 * const text = `Global Key=Some data here
 * [Section #1]
 * Section Value=42
 * Section Date=1977-05-25`;
 *
 * const parsed = parse(text);
 *
 * assertEquals(parse(text), {
 *   "Global Key": "Some data here",
 *   "Section #1": {
 *     "Section Value": 42,
 *     "Section Date": "1977-05-25",
 *   },
 * });
 *
 * assertEquals(stringify(parsed), text);
 * ```
 *
 * @module
 */

export * from "./parse.ts";
export * from "./stringify.ts";
