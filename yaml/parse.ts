// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { load, loadDocuments } from "./_loader.ts";
import { SCHEMA_MAP } from "./_schema.ts";

/** Options for {@linkcode parse}. */
export interface ParseOptions {
  /**
   * Name of the schema to use. Options includes:
   * - `default` (extends `core` schema)
   * - {@linkcode https://yaml.org/spec/1.2.2/#103-core-schema | core} (extends `json` schema)
   * - {@linkcode https://yaml.org/spec/1.2.2/#102-json-schema | json} (extends `failsafe` schema)
   * - {@linkcode https://yaml.org/spec/1.2.2/#101-failsafe-schema | failsafe}
   *
   * @default {"default"}
   */
  schema?: "core" | "default" | "failsafe" | "json" | "extended";
  /**
   * If `true`, duplicate keys will overwrite previous values. Otherwise,
   * duplicate keys will throw a {@linkcode YamlError}.
   *
   * @default {false}
   */
  allowDuplicateKeys?: boolean;
  /**
   * If defined, a function to call on warning messages taking an
   * {@linkcode Error} as its only argument.
   */
  onWarning?(error: Error): void;
}

/**
 * Parse and return a YAML string as a parsed YAML document object.
 *
 * Note: This does not support functions. Untrusted data is safe to parse.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/yaml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const data = parse(`
 * id: 1
 * name: Alice
 * `);
 *
 * assertEquals(data, { id: 1, name: "Alice" });
 * ```
 *
 * @throws {YamlError} Throws error on invalid YAML.
 * @param content YAML string to parse.
 * @param options Parsing options.
 * @returns Parsed document.
 */
export function parse(
  content: string,
  options: ParseOptions = {},
): unknown {
  return load(content, { ...options, schema: SCHEMA_MAP.get(options.schema!) });
}

/**
 * Same as {@linkcode parse}, but understands multi-document YAML sources, and
 * returns multiple parsed YAML document objects.
 *
 * @example Usage
 * ```ts
 * import { parseAll } from "@std/yaml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const data = parseAll(`
 * ---
 * id: 1
 * name: Alice
 * ---
 * id: 2
 * name: Bob
 * ---
 * id: 3
 * name: Eve
 * `);
 * assertEquals(data, [ { id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Eve" }]);
 * ```
 *
 * @param content YAML string to parse.
 * @param options Parsing options.
 * @returns Array of parsed documents.
 */
export function parseAll(content: string, options: ParseOptions = {}): unknown {
  return loadDocuments(content, {
    ...options,
    schema: SCHEMA_MAP.get(options.schema!),
  });
}
