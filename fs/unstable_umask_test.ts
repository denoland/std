// Copyright 2018-2025 the Deno authors. MIT license.

import { assert } from "@std/assert";
import { umask } from "./unstable_umask.ts";

Deno.test({
  name: "umask() change current mask",
  ignore: Deno.build.os === "windows",
}, () => {
  const previousMask = umask(0o77);
  const currentMask = umask();

  assert(currentMask !== previousMask);
});
