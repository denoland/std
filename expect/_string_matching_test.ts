// Copyright 2018-2026 the Deno authors. MIT license.

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

Deno.test("expect.not.stringMatching()", () => {
  expect("Hello, World").toEqual(expect.not.stringMatching("hello"));
  expect("foobar").toEqual(expect.not.stringMatching("bazz"));
  expect("How are you?").toEqual(expect.not.stringMatching(/Hello world!/));
  expect("queue").toEqual(expect.not.stringMatching(/en/));
  expect("\e").toEqual(expect.not.stringMatching(/\s/));
});
