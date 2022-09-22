// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { dirname, fromFileUrl, relative, resolve } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

/** Example of how to do basic tests */
Deno.test("t1", function () {
  assertEquals("hello", "hello");
});

Deno.test("t2", function () {
  assertEquals("world", "world");
});

/** A more complicated test that runs a subprocess. */
Deno.test("catSmoke", async function () {
  const { code } = await Deno.spawn(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-read",
      relative(Deno.cwd(), resolve(moduleDir, "cat.ts")),
      relative(Deno.cwd(), resolve(moduleDir, "..", "README.md")),
    ],
  });
  assertEquals(code, 0);
});
