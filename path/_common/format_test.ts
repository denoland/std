// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { _format, assertArg } from "./format.ts";

Deno.test("_format()", () => {
  assertEquals(_format("", {}), "");
  assertEquals(_format("", { root: "/" }), "/");
  assertEquals(_format("", { dir: "/foo/bar" }), "/foo/bar");
  assertEquals(_format("", { base: "baz" }), "baz");
  assertEquals(_format("", { name: "baz" }), "baz");
  assertEquals(_format("", { ext: ".js" }), ".js");
  assertEquals(_format("", { name: "baz", ext: ".js" }), "baz.js");
  assertEquals(_format("", { root: "/", base: "baz" }), "/baz");
  assertEquals(_format("", { root: "/", name: "baz" }), "/baz");
  assertEquals(_format("", { root: "/", ext: ".js" }), "/.js");
  assertEquals(_format("", { root: "/", name: "baz", ext: ".js" }), "/baz.js");
  assertEquals(_format("/", { dir: "/foo/bar", base: "baz" }), "/foo/bar/baz");
  assertEquals(
    _format("/", { dir: "/foo/bar", base: "baz", ext: ".js" }),
    "/foo/bar/baz",
  );
  assertEquals(
    _format("/", { dir: "/foo/bar", name: "baz", ext: ".js" }),
    "/foo/bar/baz.js",
  );
});

Deno.test("assertArg()", () => {
  assertEquals(assertArg({}), undefined);
  assertEquals(assertArg({ root: "/" }), undefined);
  assertEquals(assertArg({ dir: "/foo/bar" }), undefined);
});

Deno.test("assertArg() throws", () => {
  assertThrows(
    // @ts-expect-error - testing invalid input
    () => assertArg(null),
    TypeError,
    `The "pathObject" argument must be of type Object, received type "object"`,
  );
  assertThrows(
    // @ts-expect-error - testing invalid input
    () => assertArg(undefined),
    TypeError,
    `The "pathObject" argument must be of type Object, received type "undefined"`,
  );
  assertThrows(
    // @ts-expect-error - testing invalid input
    () => assertArg(""),
    TypeError,
    `The "pathObject" argument must be of type Object, received type "string"`,
  );
});
