// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Stack } from "./stack.ts";
import { test, assert } from "../testing/mod.ts";

test(function stack() {
  const s = new Stack([1, 2, 3]);
  assert.equal(s.peek(), 3);
  s.push(4);
  assert.equal(s.size, 4);
  assert.equal(s.pop(), 4);
  assert.equal(s.pop(), 3);
  assert.equal(s.pop(), 2);
  assert.equal(s.pop(), 1);
  assert.equal(s.pop(), undefined);
  assert.equal(s.size, 0);
});

test(function stackIter() {
  const s = new Stack([1, 2, 3]);
  const arr = [...s];
  assert.equal(arr, [3, 2, 1]);
});
