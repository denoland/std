// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { strip, stripEnd, stripStart } from "./unstable_strip.ts";

Deno.test("stripStart()", async (t) => {
  await t.step("strips prefixes", () => {
    assertEquals(stripStart("..x.x..", "."), "x.x..");
  });

  await t.step("strips prefixes with count", () => {
    assertEquals(stripStart("..x.x..", ".", { count: 0 }), "..x.x..");
    assertEquals(stripStart("..x.x..", ".", { count: 1 }), ".x.x..");
    assertEquals(stripStart("..x.x..", ".", { count: 2 }), "x.x..");
    assertEquals(stripStart("..x.x..", ".", { count: 3 }), "x.x..");
  });

  await t.step("strips multi-char prefixes", () => {
    assertEquals(stripStart("._.._._.x.x._._.._.", "._."), "_.x.x._._.._.");
  });

  await t.step("strips prefixes by regex pattern", () => {
    assertEquals(stripStart("!@#$%x.x!@#$%", /./), "");
    assertEquals(
      stripStart("!@#$%x.x!@#$%", /[^\p{L}\p{M}\p{N}]+/u),
      "x.x!@#$%",
    );
  });
});

Deno.test("stripEnd()", async (t) => {
  await t.step("strips suffixes", () => {
    assertEquals(stripEnd("..x.x..", "."), "..x.x");
  });

  await t.step("strips suffixes with a specific count", () => {
    assertEquals(stripEnd("..x.x..", ".", { count: 0 }), "..x.x..");
    assertEquals(stripEnd("..x.x..", ".", { count: 1 }), "..x.x.");
    assertEquals(stripEnd("..x.x..", ".", { count: 2 }), "..x.x");
    assertEquals(stripEnd("..x.x..", ".", { count: 3 }), "..x.x");
  });

  await t.step("strips multi-char suffixes", () => {
    assertEquals(stripEnd("._.._._.x.x._._.._.", "._."), "._.._._.x.x._");
  });

  await t.step("strips suffixes by regex pattern", () => {
    assertEquals(stripEnd("!@#$%x.x!@#$%", /./), "");
    assertEquals(stripEnd("!@#$%x.x!@#$%", /[^\p{L}\p{M}\p{N}]+/u), "!@#$%x.x");
  });
});

Deno.test("strip()", async (t) => {
  await t.step("strips prefixes and suffixes", () => {
    assertEquals(strip("..x.x..", "."), "x.x");
  });

  await t.step("strips prefixes and suffixes with a specific count", () => {
    assertEquals(strip("..x.x..", ".", { count: 0 }), "..x.x..");
    assertEquals(strip("..x.x..", ".", { count: 1 }), ".x.x.");
    assertEquals(strip("..x.x..", ".", { count: 2 }), "x.x");
    assertEquals(strip("..x.x..", ".", { count: 3 }), "x.x");
  });

  await t.step("strips multi-char prefixes and suffixes", () => {
    assertEquals(strip("._.._._.x.x._._.._.", "._."), "_.x.x._");
  });

  await t.step("strips prefixes and suffixes by regex pattern", () => {
    assertEquals(strip("!@#$%x.x!@#$%", /./), "");
    assertEquals(strip("!@#$%x.x!@#$%", /[^\p{L}\p{M}\p{N}]+/u), "x.x");
  });
});
