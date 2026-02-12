// Copyright 2018-2026 the Deno authors. MIT license.
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
 * The output is fully JSON-compatible, with additional escaping of sequences that can be problematic within `<script>` tags.
 *
 * @param data The data to escape.
 * @param options Options for escaping.
 * @returns The escaped string.
 *
 * @example Escaping a string
 * ```ts
 * import { escapeJs } from "@std/html/unstable-escape-js";
 * import { assertEquals } from "@std/assert";
 * const input = "\u2028\u2029</script>";
 * assertEquals(escapeJs(input), '"\\u2028\\u2029\\u003c/script>"');
 * ```
 *
 * @example Escaping an object
 * ```ts
 * import { escapeJs } from "@std/html/unstable-escape-js";
 * import { assertEquals } from "@std/assert";
 * const input = {
 *   "<SCRIPT>": "</script>",
 *   "<!--": "\u2028\u2029<>",
 * };
 * assertEquals(
 *  escapeJs(input),
 *  '{"\\u003cSCRIPT>":"\\u003c/script>","\\u003c!--":"\\u2028\\u2029<>"}',
 * );
 * ```
 *
 * @example Interpolating arbitrary data in a script tag
 * ```ts no-assert ignore
 * // might be nested arbitrarily deeply
 * declare const data: string | number | Record<string, string> | Record<string, Record<string, string>>;
 * const scriptHtml = `<script>window.handleData(${escapeJs(data)})</script>`;
 * ```
 *
 * @example Interpolating into a JSON script (e.g. importmap)
 * ```ts no-assert ignore
 * const importMap = { imports: { zod: 'https://esm.sh/v131/zod@3.21.4' } };
 * const importMapHtml = `<script type="importmap">${escapeJs(importMap)}</script>`;
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
