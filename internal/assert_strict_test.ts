// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assertStrictRejects,
  assertStrictThrows,
  StrictAssertionError,
} from "./assert_strict.ts";

Deno.test("assertStrictThrows() passes with correct error class and message", () => {
  assertStrictThrows(
    () => {
      throw new RangeError("Out of range");
    },
    RangeError,
    "Out of range",
  );
});

Deno.test("assertStrictThrows() throws with non-error object", () => {
  assertStrictThrows(
    () => {
      assertStrictThrows(
        () => {
          throw "Not an error";
        },
        TypeError,
        "Out of range",
      );
    },
    StrictAssertionError,
    `Expected "error" to be an Error object`,
  );
});

Deno.test("assertStrictThrows() throws with incorrect error class", () => {
  assertStrictThrows(
    () => {
      assertStrictThrows(
        () => {
          throw new RangeError("Out of range");
        },
        TypeError,
        "Out of range",
      );
    },
    StrictAssertionError,
    `Expected error to be instance of "TypeError", but was "RangeError"`,
  );
});

Deno.test("assertStrictThrows() throws with incorrect error message", () => {
  assertStrictThrows(
    () => {
      assertStrictThrows(
        () => {
          throw new RangeError("Out of range");
        },
        RangeError,
        "Within range",
      );
    },
    StrictAssertionError,
    `Expected error message to be "Within range", but got "Out of range"`,
  );
});

Deno.test("assertStrictRejects() passes with correct error class and message", async () => {
  await assertStrictRejects(
    async () => {
      await Promise.reject(new RangeError("Out of range"));
    },
    RangeError,
    "Out of range",
  );
});

Deno.test("assertStrictRejects() rejects with non-error object", async () => {
  await assertStrictRejects(
    async () => {
      await assertStrictRejects(
        async () => {
          await Promise.reject("Not an error");
        },
        TypeError,
        "Out of range",
      );
    },
    StrictAssertionError,
    `Expected "error" to be an Error object`,
  );
});

Deno.test("assertStrictRejects() rejects with incorrect error class", async () => {
  await assertStrictRejects(
    async () => {
      await assertStrictRejects(
        async () => {
          await Promise.reject(new RangeError("Out of range"));
        },
        TypeError,
        "Out of range",
      );
    },
    StrictAssertionError,
    `Expected error to be instance of "TypeError", but was "RangeError"`,
  );
});

Deno.test("assertStrictRejects() rejects with incorrect error message", async () => {
  await assertStrictRejects(
    async () => {
      await assertStrictRejects(
        async () => {
          await Promise.reject(new RangeError("Out of range"));
        },
        RangeError,
        "Within range",
      );
    },
    StrictAssertionError,
    `Expected error message to be "Within range", but got "Out of range"`,
  );
});
