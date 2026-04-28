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

Deno.test("pooledMapSettled() throws for invalid poolLimit", () => {
  const noop = (i: number) => i;
  for (const poolLimit of [0, -1, 1.5, NaN, Infinity]) {
    assertThrows(
      () => pooledMapSettled([1], noop, { poolLimit }),
      RangeError,
      "'poolLimit' must be a positive integer",
    );
  }
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

Deno.test("pooledMapSettled() propagates source iterable error after in-flight results", async () => {
  async function* failing() {
    yield 1;
    yield 2;
    throw new Error("source failed");
  }

  const collected: PromiseSettledResult<number>[] = [];

  await assertRejects(
    async () => {
      for await (
        const result of pooledMapSettled(
          failing(),
          (i) => Promise.resolve(i * 10),
          { poolLimit: 2 },
        )
      ) {
        collected.push(result);
      }
    },
    Error,
    "source failed",
  );

  assertEquals(collected, [
    { status: "fulfilled", value: 10 },
    { status: "fulfilled", value: 20 },
  ]);
});

Deno.test("pooledMapSettled() source error is not wrapped as PromiseSettledResult", async () => {
  async function* failing() {
    yield 1;
    throw new Error("source failed");
  }

  const collected: PromiseSettledResult<number>[] = [];

  await assertRejects(
    async () => {
      for await (
        const result of pooledMapSettled(
          failing(),
          async (i) => {
            await delay(10);
            return i;
          },
          { poolLimit: 2 },
        )
      ) {
        collected.push(result);
      }
    },
    Error,
    "source failed",
  );

  assertEquals(collected, [{ status: "fulfilled", value: 1 }]);
});

Deno.test("pooledMapSettled() rejects with source error when signal is not yet aborted at source failure", async () => {
  const controller = new AbortController();

  async function* failingSource() {
    yield 1;
    yield 2;
    throw new Error("source failed");
  }

  const collected: PromiseSettledResult<number>[] = [];

  await assertRejects(
    async () => {
      for await (
        const result of pooledMapSettled(
          failingSource(),
          async (i) => {
            await delay(20);
            if (i === 2) controller.abort(new Error("abort later"));
            return i;
          },
          { poolLimit: 3, signal: controller.signal },
        )
      ) {
        collected.push(result);
      }
    },
    Error,
    "source failed",
  );

  assertGreaterOrEqual(collected.length, 1);
});

Deno.test("pooledMapSettled() rejects with abort reason when signal is already aborted at source failure", async () => {
  const controller = new AbortController();

  function* failingSource() {
    yield 1;
    controller.abort(new Error("aborted"));
    throw new Error("source failed");
  }

  const collected: PromiseSettledResult<number>[] = [];

  await assertRejects(
    async () => {
      for await (
        const result of pooledMapSettled(
          failingSource(),
          (i) => Promise.resolve(i),
          { poolLimit: 2, signal: controller.signal },
        )
      ) {
        collected.push(result);
      }
    },
    Error,
    "aborted",
  );

  assertEquals(collected, [{ status: "fulfilled", value: 1 }]);
});

Deno.test({
  name:
    "pooledMapSettled() reacts to abort while waiting for slow async source",
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
          pooledMapSettled(slowSource(), (i) => i, {
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
  name: "pooledMapSettled() reacts to abort with stalled async source",
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
          pooledMapSettled(stalledSource(), (i) => i, {
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

// Early consumer break tests are grouped at the end of this file because
// breaking out of `for await` leaves the producer IIFE running with in-flight
// timers that cannot be deterministically drained. Sanitizers are disabled
// following the same pattern as delay_test.ts.

Deno.test({
  name:
    "pooledMapSettled() handles early consumer break without unhandled rejections",
  async fn() {
    const collected: PromiseSettledResult<number>[] = [];

    for await (
      const result of pooledMapSettled(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        async (i) => {
          await delay(10);
          return i;
        },
        { poolLimit: 2 },
      )
    ) {
      collected.push(result);
      if (collected.length === 2) break;
    }

    assertEquals(collected.length, 2);
    for (const r of collected) {
      assertEquals(r.status, "fulfilled");
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "pooledMapSettled() handles early consumer break with source error",
  async fn() {
    async function* failingSource() {
      for (let i = 1; i <= 10; i++) {
        yield i;
        if (i === 5) throw new Error("source failed");
      }
    }

    const collected: PromiseSettledResult<number>[] = [];

    for await (
      const result of pooledMapSettled(
        failingSource(),
        async (i) => {
          await delay(10);
          return i;
        },
        { poolLimit: 2 },
      )
    ) {
      collected.push(result);
      if (collected.length === 2) break;
    }

    assertGreaterOrEqual(collected.length, 1);
    assertLess(collected.length, 10);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "pooledMapSettled() fallback path handles early consumer break",
  async fn() {
    const asyncIterFunc = ReadableStream.prototype[Symbol.asyncIterator];
    // deno-lint-ignore no-explicit-any
    delete (ReadableStream.prototype as any)[Symbol.asyncIterator];
    try {
      const collected: PromiseSettledResult<number>[] = [];

      for await (
        const result of pooledMapSettled(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          async (i) => {
            await delay(10);
            return i;
          },
          { poolLimit: 2 },
        )
      ) {
        collected.push(result);
        if (collected.length === 2) break;
      }

      assertEquals(collected.length, 2);
      for (const r of collected) {
        assertEquals(r.status, "fulfilled");
      }
    } finally {
      ReadableStream.prototype[Symbol.asyncIterator] = asyncIterFunc;
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
