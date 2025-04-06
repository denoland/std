// Copyright 2018-2025 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toThrow()", () => {
  expect(() => {
    throw new Error("Hello world");
  }).toThrow();

  expect(() => {}).not.toThrow();

  assertThrows(() => {
    expect(() => {}).toThrow();
  }, AssertionError);

  assertThrows(() => {
    expect(() => {
      throw new Error("Hello world");
    }).not.toThrow();
  }, AssertionError);

  // Passes when type is correct
  expect(() => {
    throw new AssertionError("Hello world");
  }).toThrow(AssertionError);

  // Throws when type is incorrect
  assertThrows(
    () => {
      expect(() => {
        throw new Error("Hello world");
      }).toThrow(AssertionError);
    },
    AssertionError,
    'Expected error to be instance of "AssertionError", but was "Error".',
  );

  // Passes when error instance type is correct
  expect(() => {
    throw new AssertionError("Hello world");
  }).toThrow(new AssertionError("Hello world"));

  // Throws when error instance type is incorrect
  assertThrows(
    () => {
      expect(() => {
        throw new Error("Hello world");
      }).toThrow(new AssertionError("Hello world"));
    },
    AssertionError,
    'Expected error to be instance of "AssertionError", but was "Error".',
  );

  // Passes when literal string is in error
  expect(() => {
    throw new AssertionError("Hello world");
  }).toThrow("Hello");

  // Throws when literal string is not in error
  assertThrows(
    () => {
      expect(() => {
        throw new AssertionError("Hello world");
      }).toThrow("Goodbye");
    },
    AssertionError,
    'Expected error message to include "Goodbye", but got "Hello world".',
  );

  // Passes when error instance string is in error
  expect(() => {
    throw new AssertionError("Hello world");
  }).toThrow(new AssertionError("Hello world"));

  // Throws when error instance string is not in error
  assertThrows(
    () => {
      expect(() => {
        throw new AssertionError("Hello world");
      }).toThrow(new AssertionError("Goodbye"));
    },
    AssertionError,
    'Expected error message to include "Goodbye", but got "Hello world".',
  );

  // Passes when regex does match error
  expect(() => {
    throw new AssertionError("Hello world");
  }).toThrow(/\w/);

  // Throws when regex does not match error
  assertThrows(
    () => {
      expect(() => {
        throw new Error("Hello world");
      }).toThrow(/\d/);
    },
    AssertionError,
    'Expected error message to include /\\d/, but got "Hello world".',
  );
});

Deno.test("expect().toThrow() with custom error message", () => {
  const msg = "toThrow custom error message";

  assertThrows(
    () => expect(() => {}, msg).toThrow(),
    AssertionError,
    'toThrow custom error message: Expected "error" to be an Error object.',
  );
});
