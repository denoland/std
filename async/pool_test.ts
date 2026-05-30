// Copyright 2018-2026 the Deno authors. MIT license.
import { delay } from "./delay.ts";
import { pooledMap } from "./pool.ts";
import {
  assert,
  assertEquals,
  assertGreaterOrEqual,
  assertLess,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { FakeTime } from "@std/testing/time";

Deno.test("pooledMap() throws for invalid poolLimit", () => {
  const noop = (i: number) => Promise.resolve(i);
  for (const poolLimit of [0, -1, 1.5, NaN, Infinity]) {
    assertThrows(
      () => pooledMap(poolLimit, [1], noop),
      RangeError,
      "'poolLimit' must be a positive integer",
    );
  }
});

Deno.test("pooledMap()", async () => {
  using time = new FakeTime();

  const start = Date.now();
  const results = pooledMap(
    2,
    [1, 2, 3],
    (i) => new Promise<number>((r) => setTimeout(() => r(i), 300)),
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
      for await (const m of pooledMap(3, [1, 2, 3, 4], mapNumber)) {
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
    2,
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    (i) => new Promise<number>((r) => setTimeout(() => r(i), 100 / i)),
  );

  const returned = await Array.fromAsync(results);
  assertEquals(returned, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

Deno.test(
  "pooledMap() surfaces errors thrown by the input iterable (#6716)",
  async () => {
    const sentinel = new Error("Iterator failed on first step!");
    async function* errorThrowing() {
      throw sentinel;
      yield 1;
    }
    const results = pooledMap(
      2,
      errorThrowing(),
      (i: number) => Promise.resolve(i),
    );
    let caught: unknown;
    try {
      for await (const _ of results) {
        // drain
      }
    } catch (e) {
      caught = e;
    }
    assert(caught instanceof AggregateError);
    const ag = caught as AggregateError;
    assertEquals(
      ag.message,
      "Cannot complete the mapping as an error was thrown from an item",
    );
    // The previous behavior left `errors` empty; the iterable's error was
    // swallowed. Now it must be present so callers can introspect it.
    assertEquals(ag.errors.length, 1);
    assertEquals(ag.errors[0], sentinel);
  },
);

Deno.test("pooledMap() checks browser compat", async () => {
  // Simulates the environment where Symbol.asyncIterator is not available
  const asyncIterFunc = ReadableStream.prototype[Symbol.asyncIterator];
  // deno-lint-ignore no-explicit-any
  delete (ReadableStream.prototype as any)[Symbol.asyncIterator];
  try {
    const results = pooledMap(
      2,
      [1, 2, 3],
      (i) => new Promise<number>((r) => setTimeout(() => r(i), 100)),
    );
    const array = await Array.fromAsync(results);
    assertEquals(array, [1, 2, 3]);
  } finally {
    ReadableStream.prototype[Symbol.asyncIterator] = asyncIterFunc;
  }
});
