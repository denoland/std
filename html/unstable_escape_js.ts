// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode escapeJs} */
export type EscapeJsOptions = {
  /**
   * The number of spaces or tab to use for indentation in the output.
   * If not specified, no extra whitespace is added.
   */
  space?: number | "\t";
};

/**
 * Escapes a JavaScript object or other data for safe interpolation inside a `<script>` tag.
 *
 * The data must be JSON-serializable (plain object, array, string, number (excluding `NaN`/infinities), boolean, or null).
 *
 * The output remains fully JSON-compatible, but it additionally escapes characters and sequences that are problematic
 * in JavaScript contexts, including within `<script>` tags.
 *
 * @param data The data to escape.
 * @param options Options for escaping.
 * @returns The escaped string.
 *
 * @example Usage
 * ```ts
 * import { escapeJs } from "@std/html/unstable-escape-js";
 * import { assertEquals } from "@std/assert";
 * // Example data to escape
 * const input = {
 *   foo: "</script>",
 *   bar: "<SCRIPT>",
 *   baz: "<!-- ",
 *   quux: "\u2028\u2029<>",
 * };
 * assertEquals(
 *  escapeJs(input),
 *  String.raw`{"foo":"\u003c/script>","bar":"\u003cSCRIPT>","baz":"\u003c!-- ","quux":"\u2028\u2029<>"}`,
 * );
 * ```
 */
export function escapeJs(data: unknown, options: EscapeJsOptions = {}): string {
  const { space } = options;
  return JSON.stringify(data, null, space)
    .replaceAll(
      /[\u2028\u2029]|<(?=!--|\/?script)/gi,
      (m) => String.raw`\u${m.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
}
