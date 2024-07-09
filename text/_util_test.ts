// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { splitToWords } from "./_util.ts";

Deno.test({
  name: "split() handles whitespace",
  fn() {
    const result = splitToWords("deno Is AWESOME");
    const expected = ["deno", "Is", "AWESOME"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles mixed delimiters",
  fn() {
    const result = splitToWords("I am up-to-date!");
    const expected = ["I", "am", "up", "to", "date"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles upper case delimiter",
  fn() {
    const result = splitToWords("denoIsAwesome");
    const expected = ["deno", "Is", "Awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles hyphen delimiter",
  fn() {
    const result = splitToWords("deno-is-awesome");
    const expected = ["deno", "is", "awesome"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles screaming snake case",
  fn() {
    const result = splitToWords("DENO_IS_AWESOME");
    const expected = ["DENO", "IS", "AWESOME"];
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "split() handles underscore delimiter",
  fn() {
    const result = splitToWords("deno_is_awesome");
    const expected = ["deno", "is", "awesome"];
    assertEquals(result, expected);
  },
});
