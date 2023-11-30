// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * {@linkcode parse} and {@linkcode stringify} for handling
 * [INI](https://en.wikipedia.org/wiki/INI_file) encoded data, such as the
 * [Desktop Entry specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/ar01s03.html).
 * Values are parsed as strings by default to preserve data parity from the original.
 * Customization is possible in the form of reviver/replacer functions like those in `JSON.parse` and `JSON.stringify`.
 * Nested sections, repeated key names within a section, and key/value arrays are not supported,
 * but will be preserved when using {@linkcode IniMap}. Multi-line values are not supported and will throw a syntax error.
 * White space padding and lines starting with '#', ';', or '//' will be treated as comments.
 *
 * @example
 * ```ts
 * import * as ini from "https://deno.land/std@$STD_VERSION/ini/mod.ts";
 * const iniFile = `# Example configuration file
 * Global Key=Some data here
 *
 * [Section #1]
 * Section Value=42
 * Section Date=1977-05-25
 * `;
 * const parsed = ini.parse(iniFile, {
 *   reviver: (key, value, section) => {
 *     if (section === "Section #1") {
 *       if (key === "Section Value") return Number(value);
 *       if (key === "Section Date") return new Date(value);
 *     }
 *     return value;
 *   },
 * });
 * console.log(parsed);
 *
 * // =>
 * // {
 * //   "Global Key": "Some data here",
 * //   "Section #1": { "Section Value": 42, "Section Date": 1977-05-25T00:00:00.000Z }
 * // }
 *
 * const text = ini.stringify(parsed, {
 *   replacer: (key, value, section) => {
 *     if (section === "Section #1" && key === "Section Date") {
 *       return (value as Date).toISOString().split("T")[0];
 *     }
 *     return value;
 *   },
 * });
 * console.log(text);
 *
 * // =>
 * // Global Key=Some data here
 * // [Section #1]
 * // Section Value=42
 * // Section Date=1977-05-25
 * ```
 *
 * Optionally, {@linkcode IniMap} may be used for finer INI handling. Using this class will permit preserving
 * comments, accessing values like a map, iterating over key/value/section entries, and more.
 *
 * @example
 * ```ts
 * import { IniMap } from "https://deno.land/std@$STD_VERSION/ini/mod.ts";
 * const ini = new IniMap();
 * ini.set("section1", "keyA", 100)
 * console.log(ini.toString())
 *
 * // =>
 * // [section1]
 * // keyA=100
 *
 * ini.set('keyA', 25)
 * console.log(ini.toObject())
 *
 * // =>
 * // {
 * //   keyA: 25,
 * //   section1: {
 * //     keyA: 100
 * //   }
 * // }
 * ```
 *
 * The reviver and replacer APIs can be used to extend the behavior of IniMap, such as adding support
 * for duplicate keys as if they were arrays of values.
 *
 * @example
 * ```ts
 * import { IniMap } from "https://deno.land/std@$STD_VERSION/ini/mod.ts";
 * const iniFile = `# Example of key/value arrays
 * [section1]
 * key1=This key
 * key1=is non-standard
 * key1=but can be captured!
 * `;
 * const ini = new IniMap({ assignment: "=", deduplicate: true });
 * ini.parse(iniFile, (key, value, section) => {
 *   if (section) {
 *     if (ini.has(section, key)) {
 *       const exists = ini.get(section, key);
 *       if (Array.isArray(exists)) {
 *         exists.push(value);
 *         return exists;
 *       } else {
 *         return [exists, value];
 *       }
 *     }
 *   }
 *   return value;
 * });
 * console.log(ini.get("section1", "key1"));
 *
 * // => [ "This key", "is non-standard", "but can be captured!" ]
 *
 * const result = ini.toString((key, value) => {
 *   if (Array.isArray(value)) {
 *     return value.join(
 *       `${ini.formatting.lineBreak}${key}${ini.formatting.assignment}`,
 *     );
 *   }
 *   return value;
 * });
 * console.log(result === iniFile);
 *
 * // => true
 * ```
 *
 * @module
 */

export * from "./ini_map.ts";
export * from "./parse.ts";
export * from "./stringify.ts";
