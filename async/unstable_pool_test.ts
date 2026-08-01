// Copyright 2018-2026 the Deno authors. MIT license.
import { pooledMap } from "./unstable_pool.ts";
import {
  assertEquals,
  assertGreaterOrEqual,
  assertLess,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { delay } from "./delay.ts";
import { FakeTime } from "@std/testing/time";

Deno.test("pooledMap() throws for invalid poolLimit", () => {
  const noop = (i: number) => Promise.resolve(i);
  for (const poolLimit of [0, -1, 1.5, NaN, Infinity]) {
    assertThrows(
      () => pooledMap([1], noop, poolLimit),
      RangeError,
      "'poolLimit' must be a positive integer",
    );
    assertThrows(
      () => pooledMap([1], noop, { poolLimit }),
      RangeError,
      "'poolLimit' must be a positive integer",
    );
  }
});

Deno.test("pooledMap()", async () => {
  using time = new FakeTime();

  const start = Date.now();
  const results = pooledMap(
    [1, 2, 3],
    (i) => new Promise<number>((r) => setTimeout(() => r(i), 300)),
    2,
  );
  for (const _ of Array(7)) {
    time.tick(100);
    await time.runMicrotasks();
  }
  const array = await Array.fromAsync(results);
  assertEquals(array, [1, 2, 3]);
  const diff = Date.now() - start;

  assertGreaterOrEqual(diff, 600);
  assertLess(diff, 900);
});

Deno.test("pooledMap() with options form", async () => {
  using time = new FakeTime();

  const start = Date.now();
  const results = pooledMap(
    [1, 2, 3],
    (i) => new Promise<number>((r) => setTimeout(() => r(i), 300)),
    { poolLimit: 2 },
  );
  for (const _ of Array(7)) {
    time.tick(100);
    await time.runMicrotasks();
  }
  const array = await Array.fromAsync(results);
  assertEquals(array, [1, 2, 3]);
  const diff = Date.now() - start;

  assertGreaterOrEqual(diff, 600);
  assertLess(diff, 900);
});

Deno.test("pooledMap() handles errors", async () => {
  async function mapNumber(n: number): Promise<number> {
    if (n <= 2) {
      throw new Error(`Bad number: ${n}`);
    }
    await delay(100);
    return n;
  }
  const mappedNumbers: number[] = [];
  const error = await assertRejects(
    async () => {
      for await (const m of pooledMap([1, 2, 3, 4], mapNumber, 3)) {
        mappedNumbers.push(m);
      }
    },
    AggregateError,
    "Cannot complete the mapping as an error was thrown from an item",
  );
  assertEquals(error.errors.length, 2);
  assertStringIncludes(error.errors[0].stack, "Error: Bad number: 1");
  assertStringIncludes(error.errors[1].stack, "Error: Bad number: 2");
  assertEquals(mappedNumbers, [3]);
});

Deno.test("pooledMap() returns ordered items", async () => {
  const results = pooledMap(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    (i) => new Promise<number>((r) => setTimeout(() => r(i), 100 / i)),
    2,
  );

  const returned = await Array.fromAsync(results);
  assertEquals(returned, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

Deno.test("pooledMap() checks browser compat", async () => {
  const asyncIterFunc = ReadableStream.prototype[Symbol.asyncIterator];
  // deno-lint-ignore no-explicit-any
  delete (ReadableStream.prototype as any)[Symbol.asyncIterator];
  try {
    const results = pooledMap(
      [1, 2, 3],
      (i) => new Promise<number>((r) => setTimeout(() => r(i), 100)),
      2,
    );
    const array = await Array.fromAsync(results);
    assertEquals(array, [1, 2, 3]);
  } finally {
    ReadableStream.prototype[Symbol.asyncIterator] = asyncIterFunc;
  }
});

Deno.test("pooledMap() works normally without signal", async () => {
  const results = pooledMap(
    [10, 20, 30],
    async (i) => {
      await delay(10);
      return i * 2;
    },
    { poolLimit: 2 },
  );

  const array = await Array.fromAsync(results);
  assertEquals(array, [20, 40, 60]);
});

Deno.test("pooledMap() rejects immediately with already-aborted signal", async () => {
  const controller = new AbortController();
  controller.abort(new Error("already aborted"));

  const results = pooledMap(
    [1, 2, 3],
    (i) => Promise.resolve(i),
    { poolLimit: 2, signal: controller.signal },
  );

  await assertRejects(
    () => Array.fromAsync(results),
    Error,
    "already aborted",
  );
});

Deno.test("pooledMap() stops processing when signal is aborted", async () => {
  const controller = new AbortController();
  const started: number[] = [];

  const results = pooledMap(
    [1, 2, 3, 4, 5],
    async (i) => {
      started.push(i);
      await delay(50);
      if (i === 2) controller.abort(new Error("stop at 2"));
      return i;
    },
    { poolLimit: 1, signal: controller.signal },
  );

  const collected: number[] = [];
  await assertRejects(
    async () => {
      for await (const value of results) {
        collected.push(value);
      }
    },
    Error,
    "stop at 2",
  );

  assertGreaterOrEqual(started.length, 2);
  assertLess(started.length, 5);
});

Deno.test("pooledMap() aborts during pool wait", async () => {
  const controller = new AbortController();

  const results = pooledMap(
    [1, 2, 3, 4, 5, 6, 7, 8],
    async (i) => {
      await delay(200);
      return i;
    },
    { poolLimit: 2, signal: controller.signal },
  );

  setTimeout(() => controller.abort(new Error("timed out")), 50);

  await assertRejects(
    () => Array.fromAsync(results),
    Error,
    "timed out",
  );
});

Deno.test("pooledMap() rejects when aborted during the final drain", async () => {
  const controller = new AbortController();

  // poolLimit exceeds the item count, so the source is exhausted and the
  // producer is awaiting the final drain when the signal fires.
  const results = pooledMap(
    [1, 2],
    async (i) => {
      await delay(100);
      return i;
    },
    { poolLimit: 4, signal: controller.signal },
  );

  setTimeout(() => controller.abort(new Error("drain abort")), 20);

  await assertRejects(
    () => Array.fromAsync(results),
    Error,
    "drain abort",
  );
});

Deno.test("pooledMap() rejects with DOMException AbortError on bare abort", async () => {
  const controller = new AbortController();

  const results = pooledMap(
    [1, 2, 3, 4, 5],
    async (i) => {
      await delay(100);
      return i;
    },
    { poolLimit: 2, signal: controller.signal },
  );

  setTimeout(() => controller.abort(), 10);

  const error = await assertRejects(
    () => Array.fromAsync(results),
    DOMException,
  );
  assertEquals(error.name, "AbortError");
});

Deno.test("pooledMap() preserves item errors when aborted", async () => {
  const controller = new AbortController();

  const results = pooledMap(
    [1, 2, 3, 4],
    async (i) => {
      await delay(20);
      if (i === 2) {
        controller.abort(new Error("stop"));
        throw new Error("item failed");
      }
      return i;
    },
    { poolLimit: 2, signal: controller.signal },
  );

  const error = await assertRejects(
    () => Array.fromAsync(results),
    AggregateError,
    "Cannot complete the mapping as an error was thrown from an item",
  );
  assertEquals(error.errors.length, 1);
  assertStringIncludes(error.errors[0].message, "item failed");
});

Deno.test("pooledMap() closes the source iterator on abort", async () => {
  const controller = new AbortController();
  let closed = false;

  async function* source() {
    try {
      let i = 1;
      while (true) {
        yield i++;
      }
    } finally {
      closed = true;
    }
  }

  const results = pooledMap(
    source(),
    async (i) => {
      await delay(20);
      if (i === 2) controller.abort(new Error("stop"));
      return i;
    },
    { poolLimit: 1, signal: controller.signal },
  );

  await assertRejects(
    () => Array.fromAsync(results),
    Error,
    "stop",
  );
  await delay(10);
  assertEquals(closed, true);
});

Deno.test("pooledMap() ignores abort after completion", async () => {
  const controller = new AbortController();

  const results = pooledMap(
    [1, 2, 3],
    (i) => Promise.resolve(i * 2),
    { poolLimit: 2, signal: controller.signal },
  );

  const array = await Array.fromAsync(results);
  assertEquals(array, [2, 4, 6]);

  // Must be a no-op: no error and no unhandled rejection.
  controller.abort(new Error("late abort"));
});

Deno.test("pooledMap() does not retain abort listener on a long-lived signal", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  let activeListeners = 0;
  const originalAdd = signal.addEventListener.bind(signal);
  const originalRemove = signal.removeEventListener.bind(signal);
  // deno-lint-ignore no-explicit-any
  (signal as any).addEventListener = (...args: unknown[]) => {
    activeListeners++;
    return (originalAdd as (...args: unknown[]) => unknown)(...args);
  };
  // deno-lint-ignore no-explicit-any
  (signal as any).removeEventListener = (...args: unknown[]) => {
    activeListeners--;
    return (originalRemove as (...args: unknown[]) => unknown)(...args);
  };

  const array = await Array.fromAsync(
    pooledMap([1, 2, 3], (i) => Promise.resolve(i), { poolLimit: 2, signal }),
  );
  assertEquals(array, [1, 2, 3]);
  assertEquals(activeListeners, 0);
});

Deno.test({
  name: "pooledMap() reacts to abort while waiting on a slow source",
  async fn() {
    const controller = new AbortController();

    async function* slowSource() {
      yield 1;
      await new Promise((r) => setTimeout(r, 1000));
      yield 2;
    }

    setTimeout(() => controller.abort(new Error("aborted")), 25);

    const start = performance.now();
    await assertRejects(
      () =>
        Array.fromAsync(
          pooledMap(slowSource(), (i) => Promise.resolve(i), {
            poolLimit: 1,
            signal: controller.signal,
          }),
        ),
      Error,
      "aborted",
    );
    assertLess(performance.now() - start, 200);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "pooledMap() reacts to abort with a stalled source",
  async fn() {
    const controller = new AbortController();

    async function* stalledSource() {
      yield 1;
      await new Promise(() => {});
      yield 2;
    }

    setTimeout(() => controller.abort(new Error("aborted")), 25);

    const start = performance.now();
    await assertRejects(
      () =>
        Array.fromAsync(
          pooledMap(stalledSource(), (i) => Promise.resolve(i), {
            poolLimit: 1,
            signal: controller.signal,
          }),
        ),
      Error,
      "aborted",
    );
    assertLess(performance.now() - start, 200);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
