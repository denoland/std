// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "../assert/mod.ts";

Deno.test("expect().toHaveLastReturnedWith()", () => {
  const mockFn = fn();
});
