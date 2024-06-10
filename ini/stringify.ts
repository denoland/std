// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  type FormattingOptions,
  IniMap,
  type ReplacerFunction,
} from "./ini_map.ts";

/** Options for constructing INI strings. */
export interface StringifyOptions extends FormattingOptions {
  /** Provide custom string conversion for the value in a key/value pair. */
  replacer?: ReplacerFunction;
}

/**
 * Compile an object into an INI config string. Provide formatting options to modify the output.
 *
 * @param object The object to stringify
 * @param options The option to use
 * @returns The INI string
 */
export function stringify(
  // deno-lint-ignore no-explicit-any
  object: any,
  options?: StringifyOptions,
): string {
  return IniMap.from(object, options).toString(options?.replacer);
}
