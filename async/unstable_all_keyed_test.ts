// Copyright 2018-2026 the Deno authors. MIT license.
import { allKeyed, allSettledKeyed } from "./unstable_all_keyed.ts";
import {
  assertEquals,
  assertFalse,
  assertRejects,
  assertStrictEquals,
} from "@std/assert";

// allKeyed tests

Deno.test("allKeyed() resolves record of promises", async () => {
  const result = await allKeyed({
    a: Promise.resolve(1),
    b: Promise.resolve("two"),
    c: Promise.resolve(true),
  });

  assertEquals(result, { a: 1, b: "two", c: true });
});

Deno.test("allKeyed() handles mixed promises and plain values", async () => {
  const result = await allKeyed({
    promise: Promise.resolve(42),
    plain: "static",
    anotherPromise: Promise.resolve([1, 2, 3]),
  });

  assertEquals(result, {
    promise: 42,
    plain: "static",
    anotherPromise: [1, 2, 3],
  });
});

Deno.test("allKeyed() handles empty record", async () => {
  const result = await allKeyed({});
  assertEquals(result, {});
});

Deno.test("allKeyed() rejects on first rejection", async () => {
  const error = new Error("test error");

  await assertRejects(
    () =>
      allKeyed({
        a: Promise.resolve(1),
        b: Promise.reject(error),
        c: Promise.resolve(3),
      }),
    Error,
    "test error",
  );
});

Deno.test("allKeyed() preserves symbol keys", async () => {
  const sym = Symbol("test");
  const result = await allKeyed({
    [sym]: Promise.resolve("symbol value"),
    regular: Promise.resolve("regular value"),
  });

  assertEquals(result[sym], "symbol value");
  assertEquals(result.regular, "regular value");
});

Deno.test("allKeyed() ignores non-enumerable properties", async () => {
  const record = Object.create(null);
  Object.defineProperty(record, "enumerable", {
    value: Promise.resolve("visible"),
    enumerable: true,
  });
  Object.defineProperty(record, "nonEnumerable", {
    value: Promise.resolve("hidden"),
    enumerable: false,
  });

  const result = await allKeyed(record);

  assertEquals(result, { enumerable: "visible" });
  assertEquals(Object.keys(result), ["enumerable"]);
});

// allSettledKeyed tests

Deno.test("allSettledKeyed() resolves all promises", async () => {
  const result = await allSettledKeyed({
    a: Promise.resolve(1),
    b: Promise.resolve("two"),
  });

  assertEquals(result, {
    a: { status: "fulfilled", value: 1 },
    b: { status: "fulfilled", value: "two" },
  });
});

Deno.test("allSettledKeyed() handles mixed fulfilled and rejected", async () => {
  const error = new Error("rejection reason");
  const result = await allSettledKeyed({
    success: Promise.resolve("ok"),
    failure: Promise.reject(error),
  });

  assertEquals(result.success, { status: "fulfilled", value: "ok" });
  assertEquals(result.failure.status, "rejected");
  assertEquals((result.failure as PromiseRejectedResult).reason, error);
});

Deno.test("allSettledKeyed() handles all rejections without throwing", async () => {
  const error1 = new Error("error 1");
  const error2 = new Error("error 2");

  const result = await allSettledKeyed({
    a: Promise.reject(error1),
    b: Promise.reject(error2),
  });

  assertEquals(result.a.status, "rejected");
  assertEquals(result.b.status, "rejected");
  assertEquals((result.a as PromiseRejectedResult).reason, error1);
  assertEquals((result.b as PromiseRejectedResult).reason, error2);
});

Deno.test("allSettledKeyed() handles empty record", async () => {
  const result = await allSettledKeyed({});
  assertEquals(result, {});
});

Deno.test("allSettledKeyed() preserves symbol keys", async () => {
  const sym = Symbol("test");
  const result = await allSettledKeyed({
    [sym]: Promise.resolve("symbol"),
    regular: Promise.reject(new Error("fail")),
  });

  assertEquals(result[sym], { status: "fulfilled", value: "symbol" });
  assertEquals(result.regular.status, "rejected");
});

Deno.test("allKeyed() returns object with null prototype", async () => {
  const result = await allKeyed({ a: Promise.resolve(1) });

  assertStrictEquals(Object.getPrototypeOf(result), null);
  assertFalse("hasOwnProperty" in result);
  assertFalse("toString" in result);
});

Deno.test("allSettledKeyed() returns object with null prototype", async () => {
  const result = await allSettledKeyed({ a: Promise.resolve(1) });

  assertStrictEquals(Object.getPrototypeOf(result), null);
  assertFalse("hasOwnProperty" in result);
  assertFalse("toString" in result);
});

Deno.test("allKeyed() preserves numeric key order", async () => {
  const result = await allKeyed({
    "2": Promise.resolve("two"),
    "1": Promise.resolve("one"),
    "10": Promise.resolve("ten"),
  });

  assertEquals(Object.keys(result), ["1", "2", "10"]);
  assertEquals(result["1"], "one");
  assertEquals(result["2"], "two");
  assertEquals(result["10"], "ten");
});

Deno.test("allKeyed() ignores inherited properties", async () => {
  const proto = { inherited: Promise.resolve("from proto") };
  const record = Object.create(proto);
  record.own = Promise.resolve("own property");

  const result = await allKeyed(record);

  assertEquals(Object.keys(result), ["own"]);
  assertFalse("inherited" in result);
});

Deno.test("allKeyed() ignores non-enumerable symbol keys", async () => {
  const sym = Symbol("hidden");
  const record: Record<PropertyKey, Promise<string>> = {};
  Object.defineProperty(record, sym, {
    value: Promise.resolve("hidden"),
    enumerable: false,
  });
  Object.defineProperty(record, "visible", {
    value: Promise.resolve("visible"),
    enumerable: true,
  });

  const result = await allKeyed(record);

  assertEquals(Object.keys(result), ["visible"]);
  assertFalse(sym in result);
});
