// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { stripAnsi } from "https://deno.land/std@$STD_VERSION/string_width/_strip_ansi.ts";
import { unicodeWidth } from "https://deno.land/std@$STD_VERSION/string_width/_unicode_width.ts";

/**
 * Get the expected physical column width of a string in TTY-like environments.
 *
 * @example
 * ```ts
 * import { stringWidth } from "https://deno.land/std@$STD_VERSION/string_width/string_width.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(stringWidth("hello world"), 11);
 * assertEquals(stringWidth("\x1b[36mCYAN\x1b[0m"), 4);
 * assertEquals(stringWidth("天地玄黃宇宙洪荒"), 16);
 * assertEquals(stringWidth("ｆｕｌｌｗｉｄｔｈ＿ｔｅｘｔ"), 28);
 * assertEquals(stringWidth("\x1B]8;;https://deno.land\x07Deno 🦕\x1B]8;;\x07"), 7);
 * ```
 */
export function stringWidth(str: string) {
  return unicodeWidth(stripAnsi(str));
}
