// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";

Deno.test("expect.stringMatching() with strings", () => {
  expect("deno_std").toEqual(expect.stringMatching("std"));
  expect("function").toEqual(expect.stringMatching("func"));

  expect("Hello, World").not.toEqual(expect.stringMatching("hello"));
  expect("foobar").not.toEqual(expect.stringMatching("bazz"));
});

Deno.test("expect.stringMatching() with RegExp", () => {
  expect("deno_std").toEqual(expect.stringMatching(/std/));
  expect("0123456789").toEqual(expect.stringMatching(/\d+/));

  expect("\e").not.toEqual(expect.stringMatching(/\s/));
  expect("queue").not.toEqual(expect.stringMatching(/en/));
});
