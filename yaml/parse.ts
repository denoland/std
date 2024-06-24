// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Schema } from "./schema.ts";
import { type CbFunction, load, loadAll } from "./_loader/loader.ts";
import { replaceSchemaNameWithSchemaClass } from "./mod.ts";

/**
 * Options for parsing YAML.
 */
export interface ParseOptions {
  /** Uses legacy mode */
  legacy?: boolean;
  /** The listener */
  // deno-lint-ignore no-explicit-any
  listener?: ((...args: any[]) => void) | null;
  /** string to be used as a file path in error/warning messages. */
  filename?: string;
  /**
   * Specifies a schema to use.
   *
   * Schema class or its name.
   */
  schema?: string | Schema;
  /** compatibility with JSON.parse behaviour. */
  json?: boolean;
  /** function to call on warning messages. */
  onWarning?(this: null, e?: Error): void;
}

/**
 * Parses `content` as single YAML document.
 *
 * Returns a JavaScript object or throws `YAMLError` on error.
 * By default, does not support regexps, functions and undefined. This method is safe for untrusted data.
 */
export function parse(content: string, options?: ParseOptions): unknown {
  replaceSchemaNameWithSchemaClass(options);
  // deno-lint-ignore no-explicit-any
  return load(content, options as any);
}

/**
 * Same as `parse()`, but understands multi-document sources.
 * Applies iterator to each document if specified, or returns array of documents.
 *
 * @example
 * ```ts
 * import { parseAll } from "@std/yaml/parse";
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
 * console.log(data);
 * // => [ { id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Eve" } ]
 * ```
 */
export function parseAll(
  content: string,
  iterator: CbFunction,
  options?: ParseOptions,
): void;
export function parseAll(content: string, options?: ParseOptions): unknown;
export function parseAll(
  content: string,
  iteratorOrOption?: CbFunction | ParseOptions,
  options?: ParseOptions,
): unknown {
  if (typeof iteratorOrOption !== "function") {
    replaceSchemaNameWithSchemaClass(iteratorOrOption);
  }
  replaceSchemaNameWithSchemaClass(options);
  // deno-lint-ignore no-explicit-any
  return loadAll(content, iteratorOrOption as any, options as any);
}
