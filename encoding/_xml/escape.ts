/**
 * Automatically escapes XML characters in a string.
 *
 * @example
 * const unsafe = "<script>alert('Hello World')</script>";
 * const result = escape`
 *   <p>${unsafe}</p>
 * `
 *
 * console.log(result) // => <p>&lt;script&gt;alert(&apos;Hello World&apos;)&lt;/script&gt;</p>
 */
export function escape(
  templ: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = templ[0];

  for (let i = 1; i < templ.length; i++) {
    const escaped = String(values[i - 1])
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    result += escaped + templ[i];
  }

  return result;
}
