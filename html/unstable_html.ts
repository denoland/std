// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A template literal tag function for creating HTML strings with interpolated
 * values.
 *
 * This function processes template literals and concatenates them with
 * interpolated values. Values are inserted as-is without any HTML escaping or
 * sanitization. Undefined values are treated as empty strings.
 *
 * > [!WARNING]
 * > **Security Warning**: This function does NOT escape HTML. When
 * > interpolating user-provided data, you must manually escape it to prevent
 * > XSS (Cross-Site Scripting) attacks. Only use this function with trusted
 * > data or data that has been properly sanitized. Use
 * > {@linkcode https://jsr.io/@std/html/doc/~/escape | escape()} for escaping.
 *
 * @param strings The template string array containing the static parts of the template
 * @param values The values to be interpolated into the template
 * @returns The resulting HTML string with interpolated values
 *
 * @example Usage with trusted content
 * ```ts
 * import { html } from "@std/html/unstable-html";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const name = "Alice";
 * const color = "blue";
 * const htmlContent = html`
 *   <div>
 *     <h1>Hello, ${name}!</h1>
 *     <p style="color: ${color};">Welcome to our site.</p>
 *   </div>
 * `;
 *
 * assertEquals(htmlContent, `
 *   <div>
 *     <h1>Hello, Alice!</h1>
 *     <p style="color: blue;">Welcome to our site.</p>
 *   </div>
 * `);
 * ```
 *
 * @example Usage with untrusted content that needs to be escaped
 * ```ts
 * import { html } from "@std/html/unstable-html";
 * import { assertEquals } from "@std/assert/equals";
 * import { escape } from "@std/html/entities";
 *
 * // WARNING: This is vulnerable to XSS attacks!
 * const userInput = '<script>alert("XSS")</script>';
 * const unsafeHtml = html`<div>${userInput}</div>`;
 *
 * const safeHtml = html`<div>${escape(userInput)}</div>`;
 *
 * assertEquals(unsafeHtml, '<div><script>alert("XSS")</script></div>');
 * assertEquals(safeHtml, "<div>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</div>");
 * ```
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce(
    (result, str, i) => result + str + (values[i] ?? ""),
    "",
  );
}
