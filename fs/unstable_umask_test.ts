// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertNotEquals } from "@std/assert";
import { umask } from "./unstable_umask.ts";
import { platform } from "node:os";

Deno.test({
  name: "umask() changes current mask",
  ignore: platform() === "win32",
}, () => {
  const initialMask = umask(0o77);
  const updatedMask0 = umask(0o22);
  const updatedMask1 = umask();

  assertNotEquals(updatedMask0, initialMask);
  assertEquals(updatedMask0, 0o77);
  assertEquals(updatedMask1, 0o22);
});
