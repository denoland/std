// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  AssertionError,
  assertThrows,
  fail,
} from "./mod.ts";

Deno.test("assertThrows() throws when thrown error class does not match expected", () => {
  assertThrows(
    () => {
      //This next assertThrows will throw an AssertionError due to the wrong
      //expected error class
      assertThrows(
        () => {
          fail("foo");
        },
        TypeError,
        "Failed assertion: foo",
      );
    },
    AssertionError,
    `Expected error to be instance of "TypeError", but was "AssertionError"`,
  );
});

Deno.test("assertThrows() changes its return type by parameter", () => {
  assertThrows(() => {
    throw new Error();
  });
});

Deno.test("assertThrows() throws when error class is expected but non-error value is thrown", () => {
  assertThrows(
    () => {
      assertThrows(
        () => {
          throw "Panic!";
        },
        Error,
        "Panic!",
      );
    },
    AssertionError,
    "A non-Error object was thrown.",
  );
});

Deno.test("assertThrows() matches thrown non-error value", () => {
  assertThrows(
    () => {
      throw "Panic!";
    },
  );
  assertThrows(
    () => {
      throw null;
    },
  );
  assertThrows(
    () => {
      throw undefined;
    },
  );
});

Deno.test("assertThrows() matches thrown error with given error class", () => {
  assertThrows(
    () => {
      throw new Error("foo");
    },
    Error,
    "foo",
  );
});

Deno.test("assertThrows() matches and returns thrown error value", () => {
  const error = assertThrows(
    () => {
      throw new Error("foo");
    },
  );
  assert(error instanceof Error);
  assertEquals(error.message, "foo");
});

Deno.test("assertThrows() matches and returns thrown non-error", () => {
  const stringError = assertThrows(
    () => {
      throw "Panic!";
    },
  );
  assert(typeof stringError === "string");
  assertEquals(stringError, "Panic!");

  const numberError = assertThrows(
    () => {
      throw 1;
    },
  );
  assert(typeof numberError === "number");
  assertEquals(numberError, 1);

  const nullError = assertThrows(
    () => {
      throw null;
    },
  );
  assert(nullError === null);

  const undefinedError = assertThrows(
    () => {
      throw undefined;
    },
  );
  assert(typeof undefinedError === "undefined");
  assertEquals(undefinedError, undefined);
});

Deno.test("assertThrows() matches subclass of expected error", () => {
  assertThrows(
    () => {
      throw new AssertionError("Fail!");
    },
    Error,
    "Fail!",
  );
});
