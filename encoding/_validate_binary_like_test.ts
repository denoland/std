// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { validateBinaryLike } from "./_validate_binary_like.ts";

Deno.test("validateBinaryLike()", () => {
  assertEquals(validateBinaryLike("hello"), new TextEncoder().encode("hello"));
  assertEquals(
    validateBinaryLike(new Uint8Array([1, 2, 3])),
    new Uint8Array([1, 2, 3]),
  );
  assertEquals(
    validateBinaryLike(new Uint8Array([1, 2, 3]).buffer),
    new Uint8Array([1, 2, 3]),
  );
});

Deno.test("validateBinaryLike() throws on invalid inputs", () => {
  assertThrows(
    () => {
      validateBinaryLike(1);
    },
    TypeError,
    "Cannot validate the input as it must be a Uint8Array, a string, or an ArrayBuffer: received a value of the type number",
  );
  assertThrows(
    () => {
      validateBinaryLike(undefined);
    },
    TypeError,
    "Cannot validate the input as it must be a Uint8Array, a string, or an ArrayBuffer: received a value of the type undefined",
  );
  assertThrows(
    () => {
      validateBinaryLike(null);
    },
    TypeError,
    "Cannot validate the input as it must be a Uint8Array, a string, or an ArrayBuffer: received a value of the type null",
  );
  assertThrows(
    () => {
      validateBinaryLike({});
    },
    TypeError,
    "Cannot validate the input as it must be a Uint8Array, a string, or an ArrayBuffer: received a value of the type Object",
  );
  assertThrows(
    () => {
      validateBinaryLike(new class MyClass {}());
    },
    TypeError,
    "Cannot validate the input as it must be a Uint8Array, a string, or an ArrayBuffer: received a value of the type MyClass",
  );
  assertThrows(
    () => {
      validateBinaryLike(Object.create(null));
    },
    TypeError,
    "Cannot validate the input as it must be a Uint8Array, a string, or an ArrayBuffer: received a value of the type object",
  );
});
