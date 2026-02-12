// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
  assertThrows,
} from "@std/assert";
import { Semaphore } from "./unstable_semaphore.ts";

/** Helper to assert that a promise is blocked until released */
async function assertBlocks(
  acquirePromise: Promise<unknown>,
  release: () => void,
): Promise<void> {
  let blocked = true;
  const p = acquirePromise.then(() => blocked = false);
  await Promise.resolve();
  assert(blocked);
  release();
  await p;
  assertFalse(blocked);
}

Deno.test("Semaphore constructor throws for non-positive max", () => {
  assertThrows(() => new Semaphore(0), TypeError);
  assertThrows(() => new Semaphore(-1), TypeError);
});

Deno.test("Semaphore constructor throws for non-integer max", () => {
  assertThrows(() => new Semaphore(NaN), TypeError);
  assertThrows(() => new Semaphore(Infinity), TypeError);
  assertThrows(() => new Semaphore(1.5), TypeError);
});

Deno.test("Semaphore constructor defaults to 1", async () => {
  const sem = new Semaphore();
  await sem.acquire();
  await assertBlocks(sem.acquire(), () => sem.release());
});

Deno.test("Semaphore.acquire() blocks when no permits available", async () => {
  const sem = new Semaphore(2);
  await sem.acquire();
  await sem.acquire();
  // Third acquire should block
  await assertBlocks(sem.acquire(), () => sem.release());
});

Deno.test("Semaphore.acquire() resolves waiters in FIFO order", async () => {
  const sem = new Semaphore(1);
  await sem.acquire();
  const order: number[] = [];
  const p1 = sem.acquire().then(() => order.push(1));
  const p2 = sem.acquire().then(() => order.push(2));
  const p3 = sem.acquire().then(() => order.push(3));
  sem.release();
  await p1;
  sem.release();
  await p2;
  sem.release();
  await p3;
  assertEquals(order, [1, 2, 3]);
});

Deno.test("Semaphore.acquire() returns Disposable that releases on dispose", async () => {
  const sem = new Semaphore(1);
  const permit = await sem.acquire();
  await assertBlocks(sem.acquire(), () => permit[Symbol.dispose]());
});

Deno.test("Semaphore.tryAcquire() returns Disposable when permit available", async () => {
  const sem = new Semaphore(1);
  const permit = sem.tryAcquire();
  assertExists(permit);
  // Check that Disposable has returned and is working
  await assertBlocks(sem.acquire(), () => permit[Symbol.dispose]());
});

Deno.test("Semaphore.tryAcquire() returns undefined when no permits available", async () => {
  const sem = new Semaphore(1);
  await sem.acquire();
  const permit = sem.tryAcquire();
  assertEquals(permit, undefined);
});

Deno.test("Semaphore.release() ignores extra releases beyond max", async () => {
  const sem = new Semaphore(2);
  // Release without acquire - should be ignored
  sem.release();
  sem.release();
  sem.release();
  // Should still only allow 2 concurrent acquires
  await sem.acquire();
  await sem.acquire();
  // Third acquire should block
  await assertBlocks(sem.acquire(), () => sem.release());
});
