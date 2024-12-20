// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { strip } from "./unstable_strip.ts";

Deno.test("strip()", async (t) => {
  await t.step("strips single-char prefixes/suffixes", () => {
    assertEquals(strip("..x.x..", "."), "x.x");

    assertEquals(strip("..x.x..", ".", { start: true }), "x.x..");
    assertEquals(strip("..x.x..", ".", { end: true }), "..x.x");

    assertEquals(strip("..x.x..", ".", { end: 0 }), "..x.x..");
    assertEquals(strip("..x.x..", ".", { end: 1 }), "..x.x.");
    assertEquals(strip("..x.x..", ".", { end: 2 }), "..x.x");
    assertEquals(strip("..x.x..", ".", { end: 3 }), "..x.x");

    assertEquals(strip("..x.x..", ".", { start: 0 }), "..x.x..");
    assertEquals(strip("..x.x..", ".", { start: 1 }), ".x.x..");
    assertEquals(strip("..x.x..", ".", { start: 2 }), "x.x..");
    assertEquals(strip("..x.x..", ".", { start: 3 }), "x.x..");
  });

  await t.step("strips mult-char prefixes/suffixes", () => {
    assertEquals(strip("._.._._.x.x._._.._.", "._."), "_.x.x._");
  });

  await t.step("strips prefixes/suffixes by regex pattern", () => {
    assertEquals(strip("!@#$%x.x!@#$%", /./), "");
    assertEquals(strip("!@#$%x.x!@#$%", /[^\p{L}\p{M}\p{N}]+/u), "x.x");
  });
});
