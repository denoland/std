// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertStrictEquals } from "@std/assert";
import { Lazy } from "./unstable_lazy.ts";

Deno.test("Lazy.get() initializes and returns sync value", async () => {
  const lazy = new Lazy(() => 42);
  const value = await lazy.get();
  assertEquals(value, 42);
});

Deno.test("Lazy.get() deduplicates concurrent callers", async () => {
  let initCount = 0;
  const lazy = new Lazy<number>(async () => {
    initCount++;
    await Promise.resolve();
    return 100;
  });
  const [a, b] = await Promise.all([lazy.get(), lazy.get()]);
  assertStrictEquals(a, 100);
  assertStrictEquals(b, 100);
  assertEquals(initCount, 1);
});

Deno.test("Lazy.get() retries after rejection", async () => {
  let attempts = 0;
  const lazy = new Lazy<number>(() => {
    attempts++;
    if (attempts < 2) {
      return Promise.reject(new Error("fail"));
    }
    return Promise.resolve(1);
  });
  try {
    await lazy.get();
  } catch {
    // Expected: first attempt rejects
  }
  const value = await lazy.get();
  assertEquals(value, 1);
  assertEquals(attempts, 2);
});

Deno.test("Lazy.get() propagates rejection to all concurrent callers", async () => {
  const lazy = new Lazy<number>(() => Promise.reject(new Error("init failed")));
  const [resultA, resultB] = await Promise.allSettled([lazy.get(), lazy.get()]);
  assertEquals(resultA.status, "rejected");
  assertEquals(resultB.status, "rejected");
  assertEquals(
    (resultA as PromiseRejectedResult).reason?.message,
    "init failed",
  );
  assertEquals(
    (resultB as PromiseRejectedResult).reason?.message,
    "init failed",
  );
});

Deno.test("Lazy.initialized reflects lifecycle", async () => {
  const holder: { resolve: (v: number) => void } = { resolve: () => {} };
  const lazy = new Lazy<number>(
    () =>
      new Promise((res) => {
        holder.resolve = res;
      }),
  );

  // Before init
  assertEquals(lazy.initialized, false);

  // In-flight
  const getPromise = lazy.get();
  await Promise.resolve();
  assertEquals(lazy.initialized, false);

  // After init
  holder.resolve(1);
  await getPromise;
  assertEquals(lazy.initialized, true);

  // After reset
  lazy.reset();
  assertEquals(lazy.initialized, false);

  // After rejected init
  const failing = new Lazy<number>(() => Promise.reject(new Error("fail")));
  try {
    await failing.get();
  } catch {
    // expected
  }
  assertEquals(failing.initialized, false);
});

Deno.test("Lazy.initialized disambiguates T = undefined", async () => {
  const lazy = new Lazy<undefined>(() => undefined);
  assertEquals(lazy.initialized, false);
  assertEquals(lazy.peek(), undefined);
  await lazy.get();
  assertEquals(lazy.initialized, true);
  assertEquals(lazy.peek(), undefined);
});

Deno.test("Lazy.peek() returns undefined while in-flight", async () => {
  const holder: { resolve: (v: number) => void } = { resolve: () => {} };
  const lazy = new Lazy<number>(
    () =>
      new Promise((res) => {
        holder.resolve = res;
      }),
  );
  const getPromise = lazy.get();
  await Promise.resolve();
  assertEquals(lazy.peek(), undefined);
  holder.resolve(99);
  assertEquals(await getPromise, 99);
});

Deno.test("Lazy.peek() returns value after initialization", async () => {
  const lazy = new Lazy(() => 42);
  await lazy.get();
  assertEquals(lazy.peek(), 42);
});

Deno.test("Lazy.reset() causes re-initialization", async () => {
  let initCount = 0;
  const lazy = new Lazy(() => {
    initCount++;
    return initCount;
  });
  assertEquals(await lazy.get(), 1);
  lazy.reset();
  assertEquals(await lazy.get(), 2);
  assertEquals(initCount, 2);
});

Deno.test("Lazy.reset() does not affect in-flight initialization", async () => {
  const holder: { resolve: (v: string) => void } = { resolve: () => {} };
  const lazy = new Lazy<string>(
    () =>
      new Promise((res) => {
        holder.resolve = res;
      }),
  );
  const getPromise = lazy.get();
  await Promise.resolve();
  lazy.reset();
  holder.resolve("ok");
  const value = await getPromise;
  assertEquals(value, "ok");
});
