// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { pipe } from "./mod.ts";

Deno.test("pipe() handles mixed types", () => {
  const inputPipe = pipe(
    Math.abs,
    Math.sqrt,
    Math.floor,
    (num) => `result: ${num}`,
  );
  assertEquals(inputPipe(-2), "result: 1");
});

Deno.test("en empty pipe is the identity function", () => {
  const inputPipe = pipe();
  assertEquals(inputPipe("hello"), "hello");
});

Deno.test("pipe() throws an exceptions when a function throws an exception", () => {
  const inputPipe = pipe(
    Math.abs,
    Math.sqrt,
    Math.floor,
    (num) => {
      throw new Error("This is an error for " + num);
    },
    (num) => `result: ${num}`,
  );
  assertThrows(() => inputPipe(-2));
});
