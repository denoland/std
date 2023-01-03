// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "../testing/asserts.ts";
import { deferred } from "./deferred.ts";
import { deadline, DeadlineError } from "./deadline.ts";

Deno.test("[async] deadline: return fulfilled promise", async () => {
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  const result = await deadline(p, 1000);
  assertEquals(result, "Hello");
  clearTimeout(t);
});

Deno.test("[async] deadline: throws DeadlineError", async () => {
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 1000);
  await assertRejects(async () => {
    await deadline(p, 100);
  }, DeadlineError);
  clearTimeout(t);
});

Deno.test("[async] deadline: thrown when promise is rejected", async () => {
  const p = deferred();
  const t = setTimeout(() => p.reject(new Error("booom")), 100);
  await assertRejects(
    async () => {
      await deadline(p, 1000);
    },
    Error,
    "booom",
  );
  clearTimeout(t);
});
