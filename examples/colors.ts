// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** An example using `std/fmt/colors`.
 *
 * @module
 */

import { bgBlue, bold, italic, red } from "../fmt/colors.ts";

if (import.meta.main) {
  console.log(bgBlue(italic(red(bold("Hello world!")))));
}
