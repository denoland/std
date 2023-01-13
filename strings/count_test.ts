// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { count } from "./count.ts";

Deno.test("[STRINGS] count", () => {
  assertEquals(count("cheese", "e"), 3);
  assertEquals(count("five", ""), 5);
  assertEquals(count("", ""), 1);
  assertEquals(count("", "notempty"), 0);
  assertEquals(count("notempty", ""), 9);
  assertEquals(count("smaller", "not smaller"), 0);
  assertEquals(count("12345678987654321", "6"), 2);
  assertEquals(count("611161116", "6"), 3);
  assertEquals(count("notequal", "NotEqual"), 0);
  assertEquals(count("equal", "equal"), 1);
  assertEquals(count("abc1231231123q", "123"), 3);
  assertEquals(count("11111", "11"), 2);
});
