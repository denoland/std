// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { allExtensions } from "./all_extensions.ts";

Deno.test({
  name: "extensionsByType()",
  fn() {
    const fixtures: [string, string[] | undefined][] = [
      ["text/plain; charset", undefined],
      ["image/gif", ["gif"]],
      ["application/javascript", ["js"]],
      ["text/javascript", ["js", "mjs"]],
      ["text/html; charset=UTF-8", ["html", "htm", "shtml"]],
      ["application/foo", undefined],
    ];
    for (const [fixture, expected] of fixtures) {
      assertEquals(allExtensions(fixture), expected);
    }
  },
});
