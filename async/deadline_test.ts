import { assertEquals, assertThrowsAsync } from "../testing/asserts.ts";
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
  await assertThrowsAsync(async () => {
    await deadline(p, 100);
  }, DeadlineError);
  clearTimeout(t);
});
