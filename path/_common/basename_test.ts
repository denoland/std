// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { assertArgs, lastPathSegment, stripSuffix } from "./basename.ts";
import { CHAR_FORWARD_SLASH } from "./constants.ts";

Deno.test("assertArgs()", () => {
  assertEquals(assertArgs("", ""), "");
  assertEquals(assertArgs("foo", "bar"), undefined);
  // @ts-expect-error - testing invalid input for suffix
  assertEquals(assertArgs("", undefined), "");
});

Deno.test("assertArgs() throws", () => {
  assertThrows(
    // @ts-expect-error - testing invalid input
    () => assertArgs(undefined, "bar"),
    TypeError,
    'Path must be a string, received "undefined"',
  );
  assertThrows(
    // @ts-expect-error - testing invalid input
    () => assertArgs("foo", undefined),
    TypeError,
    'Suffix must be a string, received "undefined"',
  );
});

Deno.test("lastPathSegment()", () => {
  assertEquals(
    lastPathSegment("foo", (char) => char === CHAR_FORWARD_SLASH),
    "foo",
  );
  assertEquals(
    lastPathSegment("foo/bar", (char) => char === CHAR_FORWARD_SLASH),
    "bar",
  );
  assertEquals(
    lastPathSegment("foo/bar/baz", (char) => char === CHAR_FORWARD_SLASH),
    "baz",
  );
});

Deno.test("stripSuffix()", () => {
  assertEquals(stripSuffix("foo", "bar"), "foo");
  assertEquals(stripSuffix("foobar", "bar"), "foo");
  assertEquals(stripSuffix("foobar", "baz"), "foobar");
  assertEquals(stripSuffix("foobar", "foobar"), "foobar");
});
