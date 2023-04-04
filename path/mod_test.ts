// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import * as path from "./mod.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test({
  name: "[path] exports os objects properly",
  fn() {
    assertEquals(path.posix.posix, path.posix);
    assertEquals(path.posix.win32, path.win32);
    assertEquals(path.win32.posix, path.posix);
    assertEquals(path.win32.win32, path.win32);
  },
});
