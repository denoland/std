// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * {@linkcode parse} and {@linkcode stringify} for handling
 * {@link https://en.wikipedia.org/wiki/INI_file | INI} encoded data, such as the
 * {@link https://specifications.freedesktop.org/desktop-entry-spec/latest/ar01s03.html | Desktop Entry specification}.
 * Values are parsed as strings by default to preserve data parity from the original.
 * Customization is possible in the form of reviver/replacer functions like those in `JSON.parse` and `JSON.stringify`.
 * Nested sections, repeated key names within a section, and key/value arrays are not supported,
 * but will be preserved when using {@linkcode IniMap}. Multi-line values are not supported and will throw a syntax error.
 * White space padding and lines starting with '#', ';', or '//' will be treated as comments.
 *
 * ```ts
 * import * as ini from "@std/ini";
 * import { assertEquals } from "@std/assert";
 *
 * const iniFile = `# Example configuration file
 * Global Key=Some data here
 *
 * [Section #1]
 * Section Value=42
 * Section Date=1977-05-25`;
 *
 * const parsed = ini.parse(iniFile, {
 *   reviver(key, value, section) {
 *     if (section === "Section #1") {
 *       if (key === "Section Value") return Number(value);
 *       if (key === "Section Date") return new Date(value);
 *     }
 *     return value;
 *   },
 * });
 *
 * assertEquals(parsed, {
 *   "Global Key": "Some data here",
 *   "Section #1": {
 *     "Section Value": 42,
 *     "Section Date": new Date("1977-05-25T00:00:00.000Z"),
 *   },
 * });
 *
 * const text = ini.stringify(parsed, {
 *   replacer(key, value, section) {
 *     if (section === "Section #1" && key === "Section Date") {
 *       return (value as Date).toISOString().split("T")[0];
 *     }
 *     return value;
 *   },
 * });
 *
 * assertEquals(text, `Global Key=Some data here
 * [Section #1]
 * Section Value=42
 * Section Date=1977-05-25`);
 * ```
 *
 * @module
 */

export * from "./parse.ts";
export * from "./stringify.ts";
