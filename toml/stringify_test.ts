// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { stringify } from "./stringify.ts";

// https://github.com/denoland/deno_std/issues/1067#issuecomment-907740319
Deno.test({
  name: "stringify() handles object value contains '='",
  fn() {
    const src = {
      "a": "a = 1",
      "helloooooooo": 1,
    };

    const actual = stringify(src, { keyAlignment: true });
    const expected = `a            = "a = 1"
helloooooooo = 1
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles key alignment",
  fn() {
    const src = {
      "a": 1,
      "aa": 1,
      "aaa": 1,
      "aaaa": 1,
      "aaaaa": 1,
    };
    const actual = stringify(src, { keyAlignment: true });
    const expected = `a     = 1
aa    = 1
aaa   = 1
aaaa  = 1
aaaaa = 1
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles empty key",
  fn() {
    const src = {
      "": "a",
      "b": { "": "c" },
    };
    const actual = stringify(src);
    const expected = `"" = "a"

[b]
"" = "c"
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles empty object",
  fn() {
    const src = {
      "a": {},
      "b": { "c": {} },
    };
    const actual = stringify(src);
    const expected = `
[a]

[b.c]
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles special keys in inline object",
  fn() {
    const src = {
      "a": [{ "/": "b" }, "c"],
    };
    const actual = stringify(src);
    const expected = 'a = [{"/" = "b"},"c"]\n';
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() throws on invalid value",
  fn() {
    assertThrows(
      () => stringify({ a: [[null]] }),
      Error,
      "should never reach",
    );
    assertThrows(
      () => stringify({ a: [[undefined]] }),
      Error,
      "should never reach",
    );
  },
});
