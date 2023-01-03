// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { createRequire } from "./module.ts";
import { assertEquals } from "../testing/asserts.ts";

const require = createRequire(import.meta.url);

Deno.test("get-caller-file works", () => {
  const getCallerFile = require("get-caller-file");
  // The caller is foo. foo belongs to this file.
  // So the getCallerFile() returns the filename of this file
  function foo() {
    return getCallerFile();
  }
  assertEquals(foo(), import.meta.url.replace(/^file:\/\//, ""));
});
