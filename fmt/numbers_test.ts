// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { addZero } from "./numbers.ts";

Deno.test({
  name: "random number",
  fn() {
    const num = Math.round(Math.random() * 9787923);
    assertEquals(num.toString(), addZero(num, num.toString().length));
  },
});

Deno.test({
  name: "bond",
  fn() {
    assertEquals("007", addZero(7, 3));
  },
});
