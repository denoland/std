// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Escapes a string for direct interpolation into an external
 * CSS style sheet, within a `<style>` element, or in a selector.
 *
 * Uses identical logic to
 * [`CSS.escape`](https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape_static)
 * in browsers.
 *
 * @param str The string to escape.
 * @returns The escaped string.
 *
 * @example Usage
 * ```ts
 * import { escapeCss } from "@std/html/unstable-escape-css";
 * import { assertEquals } from "@std/assert";
 *
 * // Invalid in a CSS selector, even though it's a valid HTML ID
 * const elementId = "123";
 * // Unsafe for interpolation
 * const contentInput = `<!-- '" --></style>`;
 *
 * const selector = `#${escapeCss(elementId)}`;
 * const content = `"${escapeCss(contentInput)}"`;
 *
 * // Usable as a CSS selector
 * assertEquals(selector, String.raw`#\31 23`);
 * // Safe for interpolation
 * assertEquals(content, String.raw`"\<\!--\ \'\"\ --\>\<\/style\>"`);
 *
 * // Usage
 * `<style>
 *  ${selector}::after {
 *    content: ${content};
 *  }
 * </style>`;
 * ```
 */
export function escapeCss(str: string): string {
  const matcher =
    // deno-lint-ignore no-control-regex
    /(\0)|([\x01-\x1f\x7f]|(?<=^-?)\d)|(^-$|[ -,.\/:-@\[-^`\{-~])/g;

  return str.replaceAll(matcher, (_, g1, g2, g3) => {
    return g1 != null
      // null char
      ? "�"
      : g2 != null
      // control char or digit at start
      ? escapeAsCodePoint(g2)
      // solo dash or special char
      : escapeChar(g3);
  });
}

function escapeAsCodePoint(char: string) {
  return `\\${char.codePointAt(0)!.toString(16)} `;
}
function escapeChar(char: string) {
  return "\\" + char;
}
