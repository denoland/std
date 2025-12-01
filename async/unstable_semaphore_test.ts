// Copyright 2018-2025 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertFalse,
  assertNotStrictEquals,
  assertStrictEquals,
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
  assertThrows(() => Semaphore.get("negative-max", -5), TypeError);
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

Deno.test("Semaphore.get() returns same instance for same key", () => {
  const a = Semaphore.get("test-key");
  const b = Semaphore.get("test-key");
  assertStrictEquals(a, b);
});

Deno.test("Semaphore.get() creates new instance for different keys", () => {
  const a = Semaphore.get("key-1");
  const b = Semaphore.get("key-2");
  assertNotStrictEquals(a, b);
});

Deno.test("Semaphore.get() ignores max parameter for existing key", async () => {
  const key = "ignore-max-test-key";
  // Create semaphore with max=1
  const a = Semaphore.get(key, 1);
  // Try to get with different max value - should return same instance
  const b = Semaphore.get(key, 5);
  assertStrictEquals(a, b);
  // Verify the semaphore still has max=1 (not 5)
  await a.acquire();
  await assertBlocks(a.acquire(), () => a.release());
});

Deno.test("Semaphore.delete() removes semaphore from registry", () => {
  const key = "delete-test-key";
  const a = Semaphore.get(key);
  assert(Semaphore.delete(key));
  assertFalse(Semaphore.delete(key));
  const b = Semaphore.get(key);
  assertNotStrictEquals(a, b);
});
