// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

// Copyright Mathias Bynens <https://mathiasbynens.be/>
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const SYMBOL_WITH_COMBINING_MARKS_REGEXP = /(\P{M})(\p{M}+)/gu;
const SURROGATE_PAIR_REGEXP = /([\uD800-\uDBFF])([\uDC00-\uDFFF])/g;

/** Options for {@linkcode reverse}  */
export type ReverseOptions = {
  /**
   * Whether to handle Unicode symbols such as 🦕 at the cost of ~60% slowdown.
   *
   * Check {@link ./unstable_reverse_bench.ts} for performance comparison.
   *
   * @default {true}
   */
  handleUnicode: boolean;
};

/**
 * Performs a Unicode-aware string reversal.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input - The input string to be reversed.
 * @param options The options for the reverse function.
 * @returns The reversed string.
 *
 * @example Standard usage
 * ```ts
 * import { reverse } from "@std/text/unstable-reverse";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(reverse("Hello, world!"), "!dlrow ,olleH");
 * assertEquals(reverse("🦕Deno♥"), "♥oneD🦕");
 * ```
 *
 * @example Performance optimization with disabled Unicode handling
 * ```ts
 * import { reverse } from "@std/text/unstable-reverse";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(reverse("Hello, world!", { handleUnicode: false }), "!dlrow ,olleH");
 * ```
 */
export function reverse(
  input: string,
  options?: Partial<ReverseOptions>,
): string {
  if (options?.handleUnicode !== false) {
    // Step 1: deal with combining marks and astral symbols (surrogate pairs)
    input = input
      // Swap symbols with their combining marks so the combining marks go first
      .replace(SYMBOL_WITH_COMBINING_MARKS_REGEXP, (_, $1, $2) => {
        // Reverse the combining marks so they will end up in the same order
        // later on (after another round of reversing)
        return reverse($2) + $1;
      })
      // Swap high and low surrogates so the low surrogates go first
      .replace(SURROGATE_PAIR_REGEXP, "$2$1");
  }

  // Step 2: reverse the code units in the string
  let result = "";
  for (let index = input.length; index--;) {
    result += input.charAt(index);
  }
  return result;
}
