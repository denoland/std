// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { pipe } from "./pipe.ts";

Deno.test("pipe() handles mixed types", () => {
  const inputPipe = pipe(
    Math.abs,
    (num) => `result: ${num}`,
  );
  assertEquals(inputPipe(-2), "result: 2");
});
Deno.test("pipe() handles first function with two arguments", () => {
  function add(a: number, b: number): number {
    return a + b;
  }
  const inputPipe = pipe(
    add,
    (num) => `result: ${num}`,
  );
  assertEquals(inputPipe(3, 2), "result: 5");
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
    (num: number) => {
      throw new Error("This is an error for " + num);
    },
    (num: number) => `result: ${num}`,
  );
  assertThrows(() => inputPipe(-2));
});
