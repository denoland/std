// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { deferred } from "./deferred.ts";

Deno.test("resolve", async function () {
  const d = deferred<string>();
  assertEquals(d.state, "pending");
  d.resolve("🦕");
  assertEquals(await d, "🦕");
  assertEquals(d.state, "fulfilled");
});

Deno.test("reject", async function () {
  const d = deferred<number>();
  assertEquals(d.state, "pending");
  d.reject(new Error("A deno error 🦕"));
  await assertRejects(async () => {
    await d;
  });
  assertEquals(d.state, "rejected");
});

Deno.test("state with promised value", async function () {
  const d = deferred<string>();
  const e = deferred<string>();
  assertEquals(d.state, "pending");
  d.resolve(e);
  assertEquals(d.state, "pending");
  e.resolve("🦕");
  assertEquals(await d, "🦕");
  assertEquals(d.state, "fulfilled");
});

Deno.test("state is readonly", () => {
  const d = deferred<string>();
  assertEquals(d.state, "pending");
  assertThrows(() => {
    (d.state as unknown) = "fulfilled";
  });
});
