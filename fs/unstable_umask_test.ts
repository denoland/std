// Copyright 2018-2025 the Deno authors. MIT license.

import { assert } from "@std/assert";
import { umask } from "./unstable_umask.ts";
import { platform } from "node:os";

Deno.test({
  name: "umask() change current mask",
  ignore: platform() === "win32",
}, () => {
  const previousMask = umask(0o77);
  const anotherMask = umask(0o22);

  assert(anotherMask !== previousMask);
});
