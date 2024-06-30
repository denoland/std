// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import * as windows from "./windows/mod.ts";

Deno.test("windows.parse() parses UNC root only path", () => {
  const parsed = windows.parse("\\\\server\\share");
  assertEquals<unknown>(parsed, {
    base: "\\",
    dir: "\\\\server\\share",
    ext: "",
    name: "",
    root: "\\\\server\\share",
  });
});
