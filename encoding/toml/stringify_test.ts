// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../../testing/asserts.ts";
import { stringify } from "./mod.ts";

// https://github.com/denoland/deno_std/issues/1067#issuecomment-907740319
Deno.test({
  name: "[TOML] object value contains '='",
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
  name: "[TOML] stringfy with key alignment",
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
