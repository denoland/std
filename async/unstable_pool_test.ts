// Copyright 2018-2026 the Deno authors. MIT license.
import { pooledMap } from "./unstable_pool.ts";
import {
  assertEquals,
  assertGreaterOrEqual,
  assertLess,
  assertRejects,
  assertStringIncludes,
} from "@std/assert";
import { delay } from "./delay.ts";
import { FakeTime } from "@std/testing/time";

Deno.test("pooledMap()", async () => {
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
      for await (const m of pooledMap([1, 2, 3, 4], mapNumber, { poolLimit: 3 })) {
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
    { poolLimit: 2 },
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
      { poolLimit: 2 },
    );
    const array = await Array.fromAsync(results);
    assertEquals(array, [1, 2, 3]);
  } finally {
    ReadableStream.prototype[Symbol.asyncIterator] = asyncIterFunc;
  }
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
