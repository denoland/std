// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
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

Deno.test("Lazy.peek() reflects lifecycle", async () => {
  const holder: { resolve: (v: number) => void } = { resolve: () => {} };
  const lazy = new Lazy<number>(
    () =>
      new Promise((res) => {
        holder.resolve = res;
      }),
  );

  // Before init
  assertEquals(lazy.peek(), { ok: false });

  // In-flight
  const getPromise = lazy.get();
  await Promise.resolve();
  assertEquals(lazy.peek(), { ok: false });

  // After init
  holder.resolve(1);
  await getPromise;
  assertEquals(lazy.peek(), { ok: true, value: 1 });

  // After reset
  lazy.reset();
  assertEquals(lazy.peek(), { ok: false });

  // After rejected init
  const failing = new Lazy<number>(() => Promise.reject(new Error("fail")));
  try {
    await failing.get();
  } catch {
    // expected
  }
  assertEquals(failing.peek(), { ok: false });
});

Deno.test("Lazy.peek() disambiguates T = undefined", async () => {
  const lazy = new Lazy<undefined>(() => undefined);
  assertEquals(lazy.peek(), { ok: false });
  await lazy.get();
  assertEquals(lazy.peek(), { ok: true, value: undefined });
});

Deno.test("Lazy.peek() returns { ok: false } while in-flight", async () => {
  const holder: { resolve: (v: number) => void } = { resolve: () => {} };
  const lazy = new Lazy<number>(
    () =>
      new Promise((res) => {
        holder.resolve = res;
      }),
  );
  const getPromise = lazy.get();
  await Promise.resolve();
  assertEquals(lazy.peek(), { ok: false });
  holder.resolve(99);
  assertEquals(await getPromise, 99);
});

Deno.test("Lazy.peek() returns { ok: true, value } after initialization", async () => {
  const lazy = new Lazy(() => 42);
  await lazy.get();
  assertEquals(lazy.peek(), { ok: true, value: 42 });
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

Deno.test("Lazy.get() resolves falsy values correctly", async (t) => {
  await t.step("0", async () => {
    const lazy = new Lazy(() => 0);
    assertEquals(await lazy.get(), 0);
    assertEquals(lazy.peek(), { ok: true, value: 0 });
  });

  await t.step("false", async () => {
    const lazy = new Lazy(() => false);
    assertEquals(await lazy.get(), false);
    assertEquals(lazy.peek(), { ok: true, value: false });
  });

  await t.step("empty string", async () => {
    const lazy = new Lazy(() => "");
    assertEquals(await lazy.get(), "");
    assertEquals(lazy.peek(), { ok: true, value: "" });
  });

  await t.step("null", async () => {
    const lazy = new Lazy<null>(() => null);
    assertEquals(await lazy.get(), null);
    assertEquals(lazy.peek(), { ok: true, value: null });
  });
});

Deno.test("Lazy.get() rejects immediately with already-aborted signal", async () => {
  const lazy = new Lazy(() => 42);
  const reason = new Error("aborted");
  await assertRejects(
    () => lazy.get({ signal: AbortSignal.abort(reason) }),
    Error,
    "aborted",
  );
  assertEquals(lazy.peek(), { ok: false });
});

Deno.test("Lazy.get() rejects when signal is aborted during initialization", async () => {
  const lazy = new Lazy<number>(
    () => new Promise(() => {}),
  );
  const controller = new AbortController();
  const getPromise = lazy.get({ signal: controller.signal });
  controller.abort(new Error("cancelled"));
  await assertRejects(
    () => getPromise,
    Error,
    "cancelled",
  );
});

Deno.test("Lazy.get() signal does not affect other callers", async () => {
  const holder: { resolve: (v: number) => void } = { resolve: () => {} };
  const lazy = new Lazy<number>(
    () =>
      new Promise((res) => {
        holder.resolve = res;
      }),
  );
  const controller = new AbortController();
  const abortable = lazy.get({ signal: controller.signal });
  const normal = lazy.get();
  controller.abort(new Error("cancelled"));

  await assertRejects(() => abortable, Error, "cancelled");

  holder.resolve(42);
  assertEquals(await normal, 42);
  assertEquals(lazy.peek(), { ok: true, value: 42 });
});

Deno.test("Lazy.get() signal is ignored after successful initialization", async () => {
  const lazy = new Lazy(() => 42);
  await lazy.get();
  const controller = new AbortController();
  const value = await lazy.get({ signal: controller.signal });
  assertEquals(value, 42);
});
