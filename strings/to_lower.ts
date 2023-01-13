
/**
 * Returns s with all Unicode letters mapped to their lower case.
 *
 * @example
 * ```ts
 * import { toLower } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * toLower("Hello, Deno!"); // hello, deno!
 * ```
 */
export function toLower(s: string): string {
  return s.toLowerCase();
}
