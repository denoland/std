// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { typeByExtension } from "./mod.ts";

Deno.test({
  name: "typeByExtension()",
  fn() {
    const fixtures = [
      ["js", "text/javascript"],
      [".js", "text/javascript"],
      ["Js", "text/javascript"],
      ["html", "text/html"],
      [".html", "text/html"],
      [".HTML", "text/html"],
      ["file.json", undefined],
      ["foo", undefined],
      [".foo", undefined],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(typeByExtension(fixture), expected);
    }
  },
});
