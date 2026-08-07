// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { delay } from "@std/async";
import { Semaphore } from "./unstable_semaphore.ts";

/** Helper to assert that a promise is blocked until released */
async function assertBlocks(
  acquirePromise: Promise<unknown>,
  release: () => void,
): Promise<void> {
  let blocked = true;
  const p = acquirePromise.then(() => (blocked = false));
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

Deno.test(
  "Semaphore.acquire() returns Disposable that releases on dispose",
  async () => {
    const sem = new Semaphore(1);
    const permit = await sem.acquire();
    await assertBlocks(sem.acquire(), () => permit[Symbol.dispose]());
  },
);

Deno.test(
  "Semaphore.tryAcquire() returns Disposable when permit available",
  async () => {
    const sem = new Semaphore(1);
    const permit = sem.tryAcquire();
    assertExists(permit);
    // Check that Disposable has returned and is working
    await assertBlocks(sem.acquire(), () => permit[Symbol.dispose]());
  },
);

Deno.test(
  "Semaphore.tryAcquire() returns undefined when no permits available",
  async () => {
    const sem = new Semaphore(1);
    await sem.acquire();
    const permit = sem.tryAcquire();
    assertEquals(permit, undefined);
  },
);

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

Deno.test(
  "Semaphore.withPermit() executes a synchronous function and returns its result",
  async () => {
    const sem = new Semaphore(1);

    const result = await sem.withPermit(() => {
      return "sync success";
    });

    assertEquals(result, "sync success");

    // Verify the permit was successfully released by trying to acquire it again
    using permit = sem.tryAcquire();
    assertExists(permit);
  },
);

Deno.test(
  "Semaphore.withPermit() executes an asynchronous function and returns its result",
  async () => {
    const sem = new Semaphore(1);

    const result = await sem.withPermit(async () => {
      await delay(10);
      return "async success";
    });

    assertEquals(result, "async success");

    // Verify the permit was released
    using permit = sem.tryAcquire();
    assertExists(permit);
  },
);

Deno.test(
  "Semaphore.withPermit() releases permit if synchronous function throws an error",
  async () => {
    const sem = new Semaphore(1);

    await assertRejects(
      () =>
        sem.withPermit(() => {
          throw new Error("Sync Error");
        }),
      Error,
      "Sync Error",
    );

    // The permit MUST be available even though the function threw an exception
    using permit = sem.tryAcquire();
    assertExists(permit);
  },
);

Deno.test(
  "Semaphore.withPermit() releases permit if asynchronous function rejects",
  async () => {
    const sem = new Semaphore(1);

    await assertRejects(
      () =>
        sem.withPermit(async () => {
          await delay(10);
          throw new Error("Async Error");
        }),
      Error,
      "Async Error",
    );

    // The permit MUST be available even though the promise rejected
    using permit = sem.tryAcquire();
    assertExists(permit);
  },
);

Deno.test(
  "Semaphore.withPermit() properly queues and limits concurrency to max permits",
  async () => {
    const maxPermits = 2;
    const sem = new Semaphore(maxPermits);

    let activeCount = 0;
    let maxActiveCount = 0;

    // Create an array of 5 asynchronous tasks
    const tasks = Array.from({ length: 5 }).map(() => {
      return sem.withPermit(async () => {
        activeCount++;

        // Record the maximum concurrent executions at any given time
        if (activeCount > maxActiveCount) {
          maxActiveCount = activeCount;
        }

        await delay(20); // Simulate some asynchronous work
        activeCount--;
      });
    });

    // Execute all tasks concurrently
    await Promise.all(tasks);

    // The maximum number of concurrent tasks should never exceed the semaphore's max capacity
    assertEquals(maxActiveCount, maxPermits);

    // All tasks should have finished properly, leaving activeCount at 0
    assertEquals(activeCount, 0);
  },
);
