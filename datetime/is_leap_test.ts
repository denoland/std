// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";
import { isLeap } from "./is_leap.ts";

Deno.test({
  name: "[std/datetime] isLeap",
  fn() {
    assert(isLeap(1992));
    assert(isLeap(2000));
    assert(!isLeap(2003));
    assert(!isLeap(2007));
  },
});
