// Copyright 2018-2026 the Deno authors. MIT license.
import { pooledMapSettled } from "./unstable_pool_settled.ts";
import {
  assertEquals,
  assertGreaterOrEqual,
  assertLess,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { delay } from "./delay.ts";

Deno.test("pooledMapSettled() throws for non-positive poolLimit", () => {
  const noop = (i: number) => i;
  assertThrows(
    () => pooledMapSettled([1], noop, { poolLimit: 0 }),
    RangeError,
    "'poolLimit' must be a positive integer",
  );
  assertThrows(
    () => pooledMapSettled([1], noop, { poolLimit: -1 }),
    RangeError,
    "'poolLimit' must be a positive integer",
  );
});

Deno.test("pooledMapSettled() throws for non-integer poolLimit", () => {
  const noop = (i: number) => i;
  assertThrows(
    () => pooledMapSettled([1], noop, { poolLimit: 1.5 }),
    RangeError,
    "'poolLimit' must be a positive integer",
  );
  assertThrows(
    () => pooledMapSettled([1], noop, { poolLimit: NaN }),
    RangeError,
    "'poolLimit' must be a positive integer",
  );
  assertThrows(
    () => pooledMapSettled([1], noop, { poolLimit: Infinity }),
    RangeError,
    "'poolLimit' must be a positive integer",
  );
});

Deno.test("pooledMapSettled() yields rejected results without stopping", async () => {
  const results = await Array.fromAsync(
    pooledMapSettled(
      [1, 2, 3, 4],
      (i) => {
        if (i % 2 === 0) throw new Error(`fail ${i}`);
        return Promise.resolve(i);
      },
      { poolLimit: 2 },
    ),
  );

  assertEquals(results.length, 4);
  assertEquals(results[0], { status: "fulfilled", value: 1 });
  assertEquals(results[1]!.status, "rejected");
  assertEquals(results[2], { status: "fulfilled", value: 3 });
  assertEquals(results[3]!.status, "rejected");
});

Deno.test("pooledMapSettled() preserves input order", async () => {
  const results = await Array.fromAsync(
    pooledMapSettled(
      [1, 2, 3, 4, 5],
      async (i) => {
        await delay(50 / i);
        return i;
      },
      { poolLimit: 3 },
    ),
  );

  assertEquals(
    results.map((r) => {
      if (r.status === "fulfilled") return r.value;
      throw new Error("unexpected rejection");
    }),
    [1, 2, 3, 4, 5],
  );
});

Deno.test("pooledMapSettled() supports sync iteratorFn", async () => {
  const results = await Array.fromAsync(
    pooledMapSettled(
      ["a", "b", "c"],
      (s) => s.toUpperCase(),
      { poolLimit: 2 },
    ),
  );

  assertEquals(results, [
    { status: "fulfilled", value: "A" },
    { status: "fulfilled", value: "B" },
    { status: "fulfilled", value: "C" },
  ]);
});

Deno.test("pooledMapSettled() respects pool limit", async () => {
  let concurrent = 0;
  let maxConcurrent = 0;

  await Array.fromAsync(
    pooledMapSettled(
      [1, 2, 3, 4, 5, 6],
      async (i) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await delay(50);
        concurrent--;
        return i;
      },
      { poolLimit: 2 },
    ),
  );

  assertGreaterOrEqual(maxConcurrent, 1);
  assertLess(maxConcurrent, 3);
});

Deno.test("pooledMapSettled() rejects with already-aborted signal", async () => {
  const controller = new AbortController();
  controller.abort(new Error("already aborted"));

  const results = pooledMapSettled(
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

Deno.test("pooledMapSettled() yields in-flight results then rejects on abort", async () => {
  const controller = new AbortController();
  const collected: PromiseSettledResult<number>[] = [];

  const results = pooledMapSettled(
    [1, 2, 3, 4, 5, 6, 7, 8],
    async (i) => {
      await delay(50);
      if (i === 2) controller.abort(new Error("stop"));
      return i;
    },
    { poolLimit: 1, signal: controller.signal },
  );

  await assertRejects(
    async () => {
      for await (const result of results) {
        collected.push(result);
      }
    },
    Error,
    "stop",
  );

  assertGreaterOrEqual(collected.length, 1);
  assertLess(collected.length, 8);
  for (const r of collected) {
    assertEquals(r.status, "fulfilled");
  }
});

Deno.test("pooledMapSettled() closes cleanly when input iterable throws", async () => {
  async function* failing() {
    yield 1;
    yield 2;
    throw new Error("source failed");
  }

  const results = await Array.fromAsync(
    pooledMapSettled(
      failing(),
      (i) => Promise.resolve(i * 10),
      { poolLimit: 2 },
    ),
  );

  assertEquals(results, [
    { status: "fulfilled", value: 10 },
    { status: "fulfilled", value: 20 },
  ]);
});

Deno.test("pooledMapSettled() checks browser compat", async () => {
  const asyncIterFunc = ReadableStream.prototype[Symbol.asyncIterator];
  // deno-lint-ignore no-explicit-any
  delete (ReadableStream.prototype as any)[Symbol.asyncIterator];
  try {
    const results = await Array.fromAsync(
      pooledMapSettled(
        [1, 2, 3],
        (i) => new Promise<number>((r) => setTimeout(() => r(i), 50)),
        { poolLimit: 2 },
      ),
    );
    assertEquals(results.length, 3);
  } finally {
    ReadableStream.prototype[Symbol.asyncIterator] = asyncIterFunc;
  }
});
