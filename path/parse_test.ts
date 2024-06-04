// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert/assert-equals";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";

Deno.test("windows.parse() parses UNC root only path", () => {
  const parsed = windows.parse("\\\\server\\share");
  console.log(parsed);
  assertEquals<unknown>(parsed, {
    base: "\\",
    dir: "\\\\server\\share",
    ext: "",
    name: "",
    root: "\\\\server\\share",
  });
});
