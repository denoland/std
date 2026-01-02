// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { extension } from "./mod.ts";

Deno.test({
  name: "extension()",
  fn() {
    const fixtures: [string, string | undefined][] = [
      ["image/gif", "gif"],
      ["application/javascript", "js"],
      ["text/html; charset=UTF-8", "html"],
      ["application/foo", undefined],
    ];
    for (const [fixture, expected] of fixtures) {
      assertEquals(extension(fixture), expected);
    }
  },
});
