// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertVersions } from "./assert_versions.ts";
import { AssertionError, assertThrows } from "./mod.ts";

Deno.test("assertVersions throws for high versions of typescript", () => {
  assertThrows(
    () => {
      assertVersions({
        typescript: {
          max: [1],
        },
      });
    },
    AssertionError,
    `Current version of typescript is ${Deno.version.typescript}, however the code requires a maximum version of 1`,
  );
});

Deno.test("assertVersions throws for high versions of deno", () => {
  assertThrows(
    () => {
      assertVersions({
        deno: {
          max: [0],
        },
      });
    },
    AssertionError,
    `Current version of deno is ${Deno.version.deno}, however the code requires a maximum version of 0`,
  );
});

Deno.test("assertVersions throws for low versions of deno", () => {
  assertThrows(
    () => {
      assertVersions({
        deno: {
          min: [2, 5],
        },
      });
    },
    AssertionError,
    `Current version of deno is ${Deno.version.deno}, however the code requires a minimum version of 2.5`,
  );
});

Deno.test("assertVersions throws for low versions of v8", () => {
  assertThrows(
    () => {
      assertVersions({
        v8: {
          min: [11, 6, 189, 12],
        },
      });
    },
    AssertionError,
    `Current version of v8 is ${Deno.version.v8}, however the code requires a minimum version of 11.6.189.12`,
  );
});

Deno.test("assertVersions doesnt throw when valid", () => {
  assertVersions({
    deno: {
      min: [1, 25],
      max: [4],
    },
    v8: {
      max: [20],
      min: [11, 6],
    },
    typescript: {
      max: [99],
      min: [2, 3, 4],
    },
  });
});
