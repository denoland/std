// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { DumperState } from "./_dumper_state.ts";
import { SCHEMA_MAP } from "./_schema.ts";
import type { StringifyOptions as StableStringifyOptions } from "./stringify.ts";

/** Options for {@linkcode stringify}. */
export type StringifyOptions = StableStringifyOptions & {
  /**
   * Strings will be quoted using this quoting style.
   * If you specify single quotes, double quotes will still be used
   * for non-printable characters.
   *
   * @default {`'`}
   */
  quoteStyle?: "'" | '"';
};

/**
 * Converts a JavaScript object or value to a YAML document string.
 *
 * @example Usage
 * ```ts
 * import { stringify } from "@std/yaml/stringify";
 * import { assertEquals } from "@std/assert";
 *
 * const data = { id: 1, name: "Alice" };
 * const yaml = stringify(data);
 *
 * assertEquals(yaml, "id: 1\nname: Alice\n");
 * ```
 *
 * @throws {TypeError} If `data` contains invalid types.
 * @param data The data to serialize.
 * @param options The options for serialization.
 * @returns A YAML string.
 */
export function stringify(
  data: unknown,
  options: StringifyOptions = {},
): string {
  const state = new DumperState({
    ...options,
    schema: SCHEMA_MAP.get(options.schema!)!,
  });
  return state.stringify(data);
}
