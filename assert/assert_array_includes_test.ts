// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertArrayIncludes, AssertionError, assertThrows } from "./mod.ts";

Deno.test("assertArrayIncludes", async (t) => {
  const fixture = ["deno", "iz", "luv"];
  const fixtureObject = [{ deno: "luv" }, { deno: "Js" }];

  await t.step("Passing cases", () => {
    assertArrayIncludes(fixture, ["deno"]);
    assertArrayIncludes(fixtureObject, [{ deno: "luv" }]);
    assertArrayIncludes(
      Uint8Array.from([1, 2, 3, 4]),
      Uint8Array.from([1, 2, 3]),
    );
    assertArrayIncludes(["a"], ["a"]);
    assertArrayIncludes(["a", "b", "c"], ["a", "b"]);
  });

  await t.step("Throwing cases", () => {
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

  await t.step("Type-check failing cases", () => {
    try {
      // @ts-expect-error 2nd arg - 'string' is not assignable to 'ArrayLikeArg<string>'.
      assertArrayIncludes(["a"], "b");
      // @ts-expect-error 1st arg - 'string' is not assignable to 'ArrayLikeArg<string>'.
      assertArrayIncludes("a", ["b"]);
      // @ts-expect-error both args - 'string' is not assignable to 'ArrayLikeArg<string>'.
      assertArrayIncludes("a", "b");
    } catch { /* ignore any runtime errors */ }
  });
});
