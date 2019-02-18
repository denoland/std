// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { assert, test } from "../testing/mod.ts";
import { Deferred, defer, delay, timeout, TimeoutError } from "./mod.ts";

function isDeferred(x): x is Deferred {
  return (
    typeof x === "object" &&
    x.promise instanceof Promise &&
    typeof x["resolve"] === "function" &&
    typeof x["reject"] === "function"
  );
}

async function timeTaken<T>(f: () => Promise<T>): Promise<number> {
  const before = new Date().getTime(); // Performance.now();
  await f();
  const after = new Date().getTime(); // Performance.now();
  return after - before;
}

test(async function asyncIsDeferred() {
  const d = defer();
  assert.assert(isDeferred(d));
  assert.assert(
    isDeferred({
      promise: null,
      resolve: () => {},
      reject: () => {}
    }) === false
  );
});

test(async function delayed() {
  const t = await timeTaken(async () => await delay(100));
  assert(t >= 100);
  assert(t < 200);
});

test(async function race() {
  const p = delay(100, "x");
  const err = timeout(300);
  const t = await timeTaken(async () => await Promise.race([p, err]));
  assert(t >= 100);
  assert(t < 200);
  const ret = await Promise.race([p, err]);
  assert.equal(ret, "x");
});

test(async function timedout() {
  let isRejected;
  const t = await timeTaken(async () => {
    await timeout(100).catch(() => {
      isRejected = true;
    });
  });
  assert(t >= 100);
  assert(t < 200);
  assert(isRejected);
});
