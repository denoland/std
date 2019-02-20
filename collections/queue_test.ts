// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Queue } from "./queue.ts";
import { test, assert } from "../testing/mod.ts";

test(function queue() {
  const q = new Queue([1, 2, 3]);
  assert.equal(q.peekLeft(), 1);
  q.push(4);
  assert.equal(q.size, 4);
  assert.equal(q.popLeft(), 1);
  assert.equal(q.popLeft(), 2);
  assert.equal(q.popLeft(), 3);
  assert.equal(q.popLeft(), 4);
  assert.equal(q.popLeft(), undefined);
  assert.equal(q.size, 0);
});

test(function queueIter() {
  const q = new Queue([1, 2, 3]);
  const arr = [...q];
  assert.equal(arr, [1, 2, 3]);
});
