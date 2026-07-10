// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const HTML_UNESCAPE_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
};

const HTML_UNESCAPE_REGEXP = /&(?:amp|lt|gt|quot|#(?:39|x27|x2F));/g;

/**
 * Unescapes HTML special characters in a string.
 *
 * @param input The string to unescape
 * @returns The unescaped string
 *
 * @example Usage
 * ```ts
 * import { unescapeHtml } from "@std/text/unescape-html";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(unescapeHtml("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"), "<script>alert('xss')</script>");
 * ```
 */
export function unescapeHtml(input: string): string {
  return input.replace(
    HTML_UNESCAPE_REGEXP,
    (entity) => HTML_UNESCAPE_MAP[entity]!,
  );
}
