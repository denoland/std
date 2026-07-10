// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_ESCAPE_REGEXP = /[&<>"']/g;

/**
 * Escapes HTML special characters in a string.
 *
 * @param input The string to escape
 * @returns The escaped string
 *
 * @example Usage
 * ```ts
 * import { escapeHtml } from "@std/text/escape-html";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(escapeHtml("<script>alert('xss')</script>"), "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
 * ```
 */
export function escapeHtml(input: string): string {
  return input.replace(
    HTML_ESCAPE_REGEXP,
    (char) => HTML_ESCAPE_MAP[char]!,
  );
}
