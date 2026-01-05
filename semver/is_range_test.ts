// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { ALL } from "./_constants.ts";
import { isRange } from "./is_range.ts";
import type { Range } from "./types.ts";

Deno.test({
  name: "isRange() handles simple range",
  fn: () => {
    const range: Range = [
      [{
        operator: ">=",
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: [],
        build: [],
      }, {
        operator: "<",
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: [],
        build: [],
      }],
    ];
    const actual = isRange(range);
    assertEquals(actual, true);
  },
});

Deno.test({
  name: "isRange() handles ALL constant",
  fn: () => {
    const range: Range = [[ALL]];
    const actual = isRange(range);
    assertEquals(actual, true);
  },
});

Deno.test({
  name: "isRange() handles null",
  fn: () => {
    const range: Range = [[null]] as unknown as Range;
    const actual = isRange(range);
    assertEquals(actual, false);
  },
});

Deno.test({
  name: "isRange() handles undefined",
  fn: () => {
    const range: Range = [[undefined]] as unknown as Range;
    const actual = isRange(range);
    assertEquals(actual, false);
  },
});

Deno.test({
  name: "isRange() handles array type",
  fn: () => {
    const range: Range = [[[1, 2, 3]]] as unknown as Range;
    const actual = isRange(range);
    assertEquals(actual, false);
  },
});

Deno.test({
  name: "isRange() handles not object type",
  fn: () => {
    const range: Range = [[[true]]] as unknown as Range;
    const actual = isRange(range);
    assertEquals(actual, false);
  },
});
