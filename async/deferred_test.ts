// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import {
  assertEquals,
  assertThrows,
  assertThrowsAsync,
} from "../testing/asserts.ts";
import { deferred } from "./deferred.ts";

Deno.test("[async] deferred: resolve", async function () {
  const d = deferred<string>();
  assertEquals(d.state, "pending");
  d.resolve("🦕");
  assertEquals(await d, "🦕");
  assertEquals(d.state, "fulfilled");
});

Deno.test("[async] deferred: reject", async function () {
  const d = deferred<number>();
  assertEquals(d.state, "pending");
  d.reject(new Error("A deno error 🦕"));
  await assertThrowsAsync(async () => {
    await d;
  });
  assertEquals(d.state, "rejected");
});

Deno.test("[async] deferred: state with promised value", async function () {
  const d = deferred<string>();
  const e = deferred<string>();
  assertEquals(d.state, "pending");
  d.resolve(e);
  assertEquals(d.state, "pending");
  e.resolve("🦕");
  assertEquals(await d, "🦕");
  assertEquals(d.state, "fulfilled");
});

Deno.test("[async] deferred: state is readonly", () => {
  const d = deferred<string>();
  assertEquals(d.state, "pending");
  assertThrows(() => {
    (d.state as unknown) = "fulfilled";
  });
});
