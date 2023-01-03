// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** Example of using `std/flags` to log arguments to the console.
 *
 * @module
 */

import { parse } from "../flags/mod.ts";

if (import.meta.main) {
  console.dir(parse(Deno.args));
}
