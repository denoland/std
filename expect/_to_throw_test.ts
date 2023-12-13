// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "../assert/mod.ts";

Deno.test("expect().toThrow()", () => {
  expect(() => {
    throw new Error("hello world");
  }).toThrow();

  expect(() => {}).not.toThrow();

  assertThrows(() => {
    expect(() => {}).toThrow();
  }, AssertionError);

  assertThrows(() => {
    expect(() => {
      throw new Error("hello world");
    }).not.toThrow();
  }, AssertionError);

  // Passes when type is correct
  expect(() => {
    throw new AssertionError("hello world");
  }).toThrow(AssertionError);

  // Throws when type is incorrect
  assertThrows(
    () => {
      expect(() => {
        throw new Error("hello world");
      }).toThrow(AssertionError);
    },
    AssertionError,
    'Expected error to be instance of "AssertionError", but was "Error".',
  );

  // Passes when error instance type is correct
  expect(() => {
    throw new AssertionError("hello world");
  }).toThrow(new AssertionError("hello world"));

  // Throws when error instance type is incorrect
  assertThrows(
    () => {
      expect(() => {
        throw new Error("hello world");
      }).toThrow(new AssertionError("hello world"));
    },
    AssertionError,
    'Expected error to be instance of "AssertionError", but was "Error".',
  );

  // Passes when literal string is in error
  expect(() => {
    throw new AssertionError("hello world");
  }).toThrow("hello");

  // Throws when literal string is not in error
  assertThrows(
    () => {
      expect(() => {
        throw new AssertionError("hello world");
      }).toThrow("goodbye");
    },
    AssertionError,
    'Expected error message to include "goodbye", but got "hello world".',
  );

  // Passes when error instance string is in error
  expect(() => {
    throw new AssertionError("hello world");
  }).toThrow(new AssertionError("hello world"));

  // Throws when error instance string is not in error
  assertThrows(
    () => {
      expect(() => {
        throw new AssertionError("hello world");
      }).toThrow(new AssertionError("goodbye"));
    },
    AssertionError,
    'Expected error message to include "goodbye", but got "hello world".',
  );

  // Passes when regex does match error
  expect(() => {
    throw new AssertionError("hello world");
  }).toThrow(/\w/);

  // Throws when regex does not match error
  assertThrows(
    () => {
      expect(() => {
        throw new Error("hello world");
      }).toThrow(/\d/);
    },
    AssertionError,
    'Expected error message to include /\\d/, but got "hello world".',
  );
});
