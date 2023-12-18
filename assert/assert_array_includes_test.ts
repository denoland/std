// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertArrayIncludes, AssertionError, assertThrows } from "./mod.ts";

const fixture = ["deno", "iz", "luv"];
const fixtureObject = [{ deno: "luv" }, { deno: "Js" }];

Deno.test("assertArrayIncludes() matches when array includes value", () => {
  assertArrayIncludes(fixture, ["deno"]);
  assertArrayIncludes(fixtureObject, [{ deno: "luv" }]);
  assertArrayIncludes(
    Uint8Array.from([1, 2, 3, 4]),
    Uint8Array.from([1, 2, 3]),
  );
  assertArrayIncludes(["a"], ["a"]);
  assertArrayIncludes(["a", "b", "c"], ["a", "b"]);
});

Deno.test("assertArrayIncludes() throws when array is missing value", () => {
  assertThrows(
    () => assertArrayIncludes(["a"], ["b"]),
    AssertionError,
    `
Expected actual: "[
  "a",
]" to include: "[
  "b",
]".
missing: [
  "b",
]
`.trim(),
  );

  assertThrows(
    () => assertArrayIncludes(fixtureObject, [{ deno: "node" }]),
    AssertionError,
    `
Expected actual: "[
  {
    deno: "luv",
  },
  {
    deno: "Js",
  },
]" to include: "[
  {
    deno: "node",
  },
]".
missing: [
  {
    deno: "node",
  },
]
`.trim(),
  );
});

// https://github.com/denoland/deno_std/issues/3372
Deno.test("assertArrayIncludes() type-checks failing cases", () => {
  // @ts-expect-error 2nd arg - 'string' is not assignable to 'ArrayLikeArg<string>'.
  assertThrows(() => assertArrayIncludes(["a"], "b"));
  // @ts-expect-error 1st arg - 'string' is not assignable to 'ArrayLikeArg<string>'.
  assertThrows(() => assertArrayIncludes("a", ["b"]));
  // @ts-expect-error both args - 'string' is not assignable to 'ArrayLikeArg<string>'.
  assertThrows(() => assertArrayIncludes("a", "b"));
});
