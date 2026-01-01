// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { getCharset } from "./mod.ts";

Deno.test({
  name: "getCharset()",
  fn() {
    const fixtures = [
      [";", undefined],
      ["text/plain; charset", undefined],
      ["text/plain", "UTF-8"],
      ["text/html", "UTF-8"],
      ["application/foo", undefined],
      ["application/news-checkgroups", "US-ASCII"],
      ["application/news-checkgroups; charset=UTF-8", "UTF-8"],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(getCharset(fixture), expected);
    }
  },
});
