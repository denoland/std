// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { test } from "../testing/mod.ts";
import { assert } from "../testing/asserts.ts";

import "./typescript.ts";

test(function tsVersionTest(): void {
  assert(ts.version != null);
});
