// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { compare } from "./strings.ts";
import { contains } from "./strings.ts";
import { count } from "./strings.ts";
import { hasPrefix } from "./strings.ts";
import { hasSuffix } from "./strings.ts";
import { toLower } from "./strings.ts";

Deno.test("[STRINGS] compare_strings", () => {
  assertEquals(compare("a", "b"), -1);
  assertEquals(compare("a", "a"), 0);
  assertEquals(compare("b", "a"), 1);
});

Deno.test("[STRINGS] contains_substring", () => {
  const k = "seafood";

  assertEquals(contains(k, "foo"), true);
  assertEquals(contains(k, "bar"), false);
  assertEquals(contains(k, ""), true);
  assertEquals(contains("", ""), true);
});

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

Deno.test("[STRINGS] hasPrefix", () => {
  assertEquals(hasPrefix("Deno", "De"), true);
  assertEquals(hasPrefix("Deno", "C"), false);
  assertEquals(hasPrefix("Deno", ""), true);
  assertEquals(hasPrefix("Deno", "d"), false);
});

Deno.test("[STRINGS] hasPrefix", () => {
  assertEquals(hasSuffix("Calvin", "in"), true);
  assertEquals(hasSuffix("Calvin", "n"), true);
  assertEquals(hasSuffix("Calvin", ""), true);
  assertEquals(hasSuffix("Calvin", "Cal"), false);
  assertEquals(hasSuffix("", "foo"), false);
  assertEquals(hasSuffix("Hobbes", "obb"), false);
  assertEquals(hasSuffix("Hobbes", "es"), true);
});

Deno.test("[STRINGS] is_lower_case", () => {
  const k = "Hello, Deno!";
  const y = "hello calvin!";

  assertEquals(toLower(k), "hello, deno!");
  assertEquals(toLower(y), "hello calvin!");
});
