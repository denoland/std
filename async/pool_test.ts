// Copyright 2018-2026 the Deno authors. MIT license.
import { delay } from "./delay.ts";
import { pooledMap } from "./pool.ts";
import {
  assertEquals,
  assertGreaterOrEqual,
  assertLess,
  assertRejects,
  assertStringIncludes,
} from "@std/assert";
import { FakeTime } from "@std/testing/time";

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
