// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { createSlidingWindow } from "./sliding_window.ts";

// --- Factory validation ---

Deno.test("createSlidingWindow() throws for invalid permitLimit", () => {
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 0,
        window: 1000,
        segmentsPerWindow: 2,
      }),
    RangeError,
    "permitLimit",
  );
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: -1,
        window: 1000,
        segmentsPerWindow: 2,
      }),
    RangeError,
    "permitLimit",
  );
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 1.5,
        window: 1000,
        segmentsPerWindow: 2,
      }),
    RangeError,
    "permitLimit",
  );
});

Deno.test("createSlidingWindow() throws for invalid window", () => {
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: 0,
        segmentsPerWindow: 2,
      }),
    RangeError,
    "window",
  );
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: -100,
        segmentsPerWindow: 2,
      }),
    RangeError,
    "window",
  );
});

Deno.test("createSlidingWindow() throws for invalid segmentsPerWindow", () => {
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: 1000,
        segmentsPerWindow: 1,
      }),
    RangeError,
    "segmentsPerWindow",
  );
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: 1000,
        segmentsPerWindow: 0,
      }),
    RangeError,
    "segmentsPerWindow",
  );
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: 1000,
        segmentsPerWindow: 1.5,
      }),
    RangeError,
    "segmentsPerWindow",
  );
});

Deno.test("createSlidingWindow() throws when window is not divisible by segmentsPerWindow", () => {
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: 1000,
        segmentsPerWindow: 3,
      }),
    RangeError,
    "divisible",
  );
});

Deno.test("createSlidingWindow() throws for invalid queueLimit", () => {
  assertThrows(
    () =>
      createSlidingWindow({
        permitLimit: 10,
        window: 1000,
        segmentsPerWindow: 2,
        queueLimit: -1,
      }),
    RangeError,
    "queueLimit",
  );
});

// --- tryAcquire ---

Deno.test("tryAcquire() succeeds within the permit limit", () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 3,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  assert(limiter.tryAcquire().acquired);
  assert(limiter.tryAcquire().acquired);
  assert(limiter.tryAcquire().acquired);
  assertFalse(limiter.tryAcquire().acquired);
});

Deno.test("tryAcquire() acquires multiple permits at once", () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  assert(limiter.tryAcquire(3).acquired);
  assertFalse(limiter.tryAcquire(3).acquired);
  assert(limiter.tryAcquire(2).acquired);
});

Deno.test("tryAcquire() rejects with retryAfter equal to segment duration", () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 4,
  });
  void time;

  limiter.tryAcquire();
  const lease = limiter.tryAcquire();
  assertFalse(lease.acquired);
  assertEquals(lease.retryAfter, 250);
});

Deno.test("tryAcquire() throws for invalid permits", () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  assertThrows(() => limiter.tryAcquire(0), RangeError);
  assertThrows(() => limiter.tryAcquire(-1), RangeError);
  assertThrows(() => limiter.tryAcquire(1.5), RangeError);
});

Deno.test("tryAcquire() throws when permits exceed permitLimit", () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  assertThrows(() => limiter.tryAcquire(6), RangeError, "exceeds");
});

// --- Sliding behavior ---

Deno.test("permits consumed in segment 0 free after N segment rotations", () => {
  using time = new FakeTime(0);
  // 4 segments, each 250ms. Full window = 1000ms.
  using limiter = createSlidingWindow({
    permitLimit: 4,
    window: 1000,
    segmentsPerWindow: 4,
  });

  // Fill all permits in segment 0
  limiter.tryAcquire(4);
  assertFalse(limiter.tryAcquire().acquired);

  // After 1 segment rotation (250ms), segment 0 is still in the window
  time.tick(250);
  assertFalse(limiter.tryAcquire().acquired);

  // After 2 rotations (500ms), segment 0 still in window
  time.tick(250);
  assertFalse(limiter.tryAcquire().acquired);

  // After 3 rotations (750ms), segment 0 still in window
  time.tick(250);
  assertFalse(limiter.tryAcquire().acquired);

  // After 4 rotations (1000ms), segment 0 is evicted — permits freed
  time.tick(250);
  assert(limiter.tryAcquire(4).acquired);
});

Deno.test("sliding window prevents boundary burst that fixed window allows", () => {
  using time = new FakeTime(0);
  // 2 segments of 500ms each, limit 10.
  using limiter = createSlidingWindow({
    permitLimit: 10,
    window: 1000,
    segmentsPerWindow: 2,
  });

  // Use all 10 permits in segment 0
  limiter.tryAcquire(10);
  assertFalse(limiter.tryAcquire().acquired);

  // After one segment rotation (500ms), only segment 0's permits are still
  // counted. A fixed window would have reset entirely, allowing 10 more.
  // The sliding window only frees what was in the evicted segment — nothing
  // yet, because segment 0 hasn't been evicted (it's now the "oldest" of 2).
  time.tick(500);
  assertFalse(limiter.tryAcquire().acquired);

  // After the second rotation (1000ms total), segment 0 is finally evicted.
  time.tick(500);
  assert(limiter.tryAcquire(10).acquired);
});

Deno.test("permits spread across segments free incrementally", () => {
  using time = new FakeTime(0);
  // 3 segments of 100ms each, limit 6.
  using limiter = createSlidingWindow({
    permitLimit: 6,
    window: 300,
    segmentsPerWindow: 3,
  });

  // Segment 0: use 2
  limiter.tryAcquire(2);
  // Segment 1: use 2
  time.tick(100);
  limiter.tryAcquire(2);
  // Segment 2: use 2 — now at limit
  time.tick(100);
  limiter.tryAcquire(2);
  assertFalse(limiter.tryAcquire().acquired);

  // Rotate once: evicts segment 0 (2 permits), freeing 2
  time.tick(100);
  assert(limiter.tryAcquire(2).acquired);
  assertFalse(limiter.tryAcquire().acquired);

  // Rotate again: evicts segment 1 (2 permits), freeing 2
  time.tick(100);
  assert(limiter.tryAcquire(2).acquired);
  assertFalse(limiter.tryAcquire().acquired);
});

// --- Manual replenishment ---

Deno.test("replenish() throws when autoReplenishment is true", () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  assertThrows(
    () => limiter.replenish(),
    Error,
    "Cannot replenish: limiter uses automatic replenishment",
  );
});

Deno.test("replenish() rotates a segment when autoReplenishment is false", () => {
  using limiter = createSlidingWindow({
    permitLimit: 4,
    window: 1000,
    segmentsPerWindow: 4,
    autoReplenishment: false,
  });

  limiter.tryAcquire(4);
  assertFalse(limiter.tryAcquire().acquired);

  // Each replenish() rotates one segment. Need 4 rotations to evict segment 0.
  limiter.replenish();
  assertFalse(limiter.tryAcquire().acquired);
  limiter.replenish();
  assertFalse(limiter.tryAcquire().acquired);
  limiter.replenish();
  assertFalse(limiter.tryAcquire().acquired);
  limiter.replenish();
  assert(limiter.tryAcquire(4).acquired);
});

// --- acquire (async) ---

Deno.test("acquire() resolves immediately when permits available", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  const lease = await limiter.acquire();
  assert(lease.acquired);
});

Deno.test("acquire() returns rejected lease when queue limit is 0", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 0,
  });
  void time;

  limiter.tryAcquire();
  const lease = await limiter.acquire();
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Queue limit exceeded");
});

Deno.test("acquire() queues and resolves after segment rotation frees capacity", async () => {
  using time = new FakeTime(0);
  // 2 segments of 500ms, limit 1
  using limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 5,
  });

  limiter.tryAcquire();

  let resolved = false;
  const promise = limiter.acquire().then((lease) => {
    resolved = true;
    return lease;
  });

  await Promise.resolve();
  assertFalse(resolved);

  // First rotation doesn't evict the segment with the permit yet
  time.tick(500);
  await Promise.resolve();
  assertFalse(resolved);

  // Second rotation evicts it
  time.tick(500);
  const lease = await promise;
  assert(resolved);
  assert(lease.acquired);
});

Deno.test("acquire() rejects when aborted via signal", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();

  const controller = new AbortController();
  const promise = limiter.acquire(1, { signal: controller.signal });
  controller.abort();

  await assertRejects(() => promise, DOMException);
});

Deno.test("acquire() rejects when signal is already aborted", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();

  await assertRejects(
    () => limiter.acquire(1, { signal: AbortSignal.abort() }),
    DOMException,
  );
});

// --- Disposal ---

Deno.test("dispose resolves queued waiters with rejected leases", async () => {
  using time = new FakeTime(0);
  const limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();
  const promise = limiter.acquire();
  limiter[Symbol.dispose]();

  const lease = await promise;
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Rate limiter has been disposed");
});

Deno.test("tryAcquire() returns rejected lease after disposal", () => {
  using time = new FakeTime(0);
  const limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  limiter[Symbol.dispose]();
  const lease = limiter.tryAcquire();
  assertFalse(lease.acquired);
});

Deno.test("acquire() rejects after disposal", async () => {
  using time = new FakeTime(0);
  const limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  limiter[Symbol.dispose]();
  await assertRejects(() => limiter.acquire(), Error, "disposed");
});

// --- Queue ordering ---

Deno.test("oldest-first queue resolves waiters in FIFO order", async () => {
  using time = new FakeTime(0);
  // 2 segments of 500ms, limit 1.
  using limiter = createSlidingWindow({
    permitLimit: 1,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 10,
    queueOrder: "oldest-first",
  });

  limiter.tryAcquire();

  const order: number[] = [];
  const p1 = limiter.acquire().then((l) => {
    order.push(1);
    return l;
  });
  const p2 = limiter.acquire().then((l) => {
    order.push(2);
    return l;
  });

  // 4 segment rotations total: first 2 free the original permit (p1 served),
  // next 2 free p1's permit (p2 served).
  time.tick(2000);
  await p1;
  await p2;

  assertEquals(order, [1, 2]);
});

Deno.test("newest-first queue resolves newest waiter first", async () => {
  using time = new FakeTime(0);
  // 4 segments of 250ms, limit 2. Two permits available at start.
  using limiter = createSlidingWindow({
    permitLimit: 2,
    window: 1000,
    segmentsPerWindow: 4,
    queueLimit: 10,
    queueOrder: "newest-first",
  });

  limiter.tryAcquire(2);

  const order: number[] = [];
  const p1 = limiter.acquire().then((l) => {
    order.push(1);
    return l;
  });
  const p2 = limiter.acquire().then((l) => {
    order.push(2);
    return l;
  });

  // 4 rotations evicts segment 0 (2 permits). newest-first serves p2 first.
  time.tick(1000);
  await p2;
  await p1;

  assertEquals(order, [2, 1]);
});

// --- Eviction ---

Deno.test("newest-first queue evicts oldest waiter when queue is full", async () => {
  using time = new FakeTime(0);
  // 4 segments of 250ms, limit 3, queue holds 2
  using limiter = createSlidingWindow({
    permitLimit: 3,
    window: 1000,
    segmentsPerWindow: 4,
    queueLimit: 2,
    queueOrder: "newest-first",
  });

  limiter.tryAcquire(3);

  const results: string[] = [];
  const p1 = limiter.acquire().then((l) => {
    results.push(l.acquired ? "p1:acquired" : `p1:${l.reason}`);
    return l;
  });
  const p2 = limiter.acquire().then((l) => {
    results.push(l.acquired ? "p2:acquired" : `p2:${l.reason}`);
    return l;
  });
  const p3 = limiter.acquire().then((l) => {
    results.push(l.acquired ? "p3:acquired" : `p3:${l.reason}`);
    return l;
  });

  await p1;
  assertEquals(results, ["p1:Evicted by newer request"]);

  // 4 rotations evicts segment 0 (3 permits freed). newest-first: p3 then p2.
  time.tick(1000);
  await p3;
  await p2;

  assertEquals(results, [
    "p1:Evicted by newer request",
    "p3:acquired",
    "p2:acquired",
  ]);
});

// --- acquire() validation ---

Deno.test("acquire() rejects for invalid permits", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  await assertRejects(() => limiter.acquire(0), RangeError);
  await assertRejects(() => limiter.acquire(-1), RangeError);
  await assertRejects(() => limiter.acquire(1.5), RangeError);
});

Deno.test("acquire() rejects when permits exceed permitLimit", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  await assertRejects(() => limiter.acquire(6), RangeError, "exceeds");
});

// --- Multiple waiters resolved in single replenishment ---

Deno.test("single replenishment resolves multiple queued waiters", async () => {
  using time = new FakeTime(0);
  // 2 segments of 500ms, limit 3.
  using limiter = createSlidingWindow({
    permitLimit: 3,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 10,
  });

  limiter.tryAcquire(3);

  const order: number[] = [];
  const p1 = limiter.acquire(1).then((l) => {
    order.push(1);
    return l;
  });
  const p2 = limiter.acquire(1).then((l) => {
    order.push(2);
    return l;
  });
  const p3 = limiter.acquire(1).then((l) => {
    order.push(3);
    return l;
  });

  await Promise.resolve();
  assertEquals(order, []);

  // 2 rotations evicts segment 0 (3 permits freed), all 3 waiters drain at once
  time.tick(1000);
  await Promise.all([p1, p2, p3]);

  assertEquals(order, [1, 2, 3]);
  for (const p of [p1, p2, p3]) {
    assert((await p).acquired);
  }
});

// --- Queue edge cases ---

Deno.test("acquire() rejects when permits exceed queueLimit even if queue is empty", async () => {
  using time = new FakeTime(0);
  using limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
    queueLimit: 2,
  });
  void time;

  limiter.tryAcquire(5);

  const lease = await limiter.acquire(3);
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Queue limit exceeded");
});

// --- Double dispose ---

Deno.test("double dispose is a no-op", () => {
  using time = new FakeTime(0);
  const limiter = createSlidingWindow({
    permitLimit: 5,
    window: 1000,
    segmentsPerWindow: 2,
  });
  void time;

  limiter[Symbol.dispose]();
  limiter[Symbol.dispose]();
});
