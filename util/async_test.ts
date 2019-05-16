// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runIfMain } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { Latch, deferred } from "./async.ts";

test(async function asyncDeferred(): Promise<void> {
  const d = deferred<number>();
  d.resolve(12);
});

async function send3(latch: Latch<number>): Promise<void> {
  await latch.send(1);
  await latch.send(2);
  await latch.send(3);
}

test(async function asyncLatch(): Promise<void> {
  const latch = new Latch<number>();
  send3(latch);

  assertEquals(1, await latch.recv());
  assertEquals(2, await latch.recv());
  assertEquals(3, await latch.recv());
  let _lastPromise = latch.recv();
});

runIfMain(import.meta);
