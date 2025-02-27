// Copyright 2018-2025 the Deno authors. MIT license.

import { assert } from "@std/assert";
import { umask } from "./unstable_umask.ts";

Deno.test("umask() change current mask", () => {
  const previousMask = umask(0o77);
  const currentMask = umask();

  assert(currentMask !== previousMask);
});
