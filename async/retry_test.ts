// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { retry, RetryError } from "./retry.ts";
import { assertEquals, assertRejects } from "../assert/mod.ts";
import { FakeTime } from "../testing/time.ts";

function generateErroringFunction(errorsBeforeSucceeds: number) {
  let errorCount = 0;

  return () => {
    if (errorCount >= errorsBeforeSucceeds) {
      return errorCount;
    }
    errorCount++;
    throw `Only errored ${errorCount} times`;
  };
}

Deno.test("retry()", async function () {
  const threeErrors = generateErroringFunction(3);
  const result = await retry(threeErrors, {
    minTimeout: 100,
  });
  assertEquals(result, 3);
});

Deno.test("retry() fails after max errors is passed", async function () {
  const fiveErrors = generateErroringFunction(5);
  await assertRejects(() =>
    retry(fiveErrors, {
      minTimeout: 100,
    })
  );
});

Deno.test("retry() waits four times by default", async function () {
  let callCount = 0;
  const onlyErrors = function () {
    callCount++;
    throw new Error("Failure");
  };
  using time = new FakeTime();
  const callCounts: Array<number> = [];
  const promise = retry(onlyErrors);
  queueMicrotask(() => callCounts.push(callCount));
  await time.next();
  queueMicrotask(() => callCounts.push(callCount));
  await time.next();
  queueMicrotask(() => callCounts.push(callCount));
  await time.next();
  queueMicrotask(() => callCounts.push(callCount));
  await time.next();
  queueMicrotask(() => callCounts.push(callCount));
  await assertRejects(() => promise, RetryError);
  assertEquals(callCounts, [1, 2, 3, 4, 5]);
});

Deno.test(
  "retry() throws if minTimeout is less than maxTimeout",
  async function () {
    await assertRejects(() =>
      retry(() => {}, {
        minTimeout: 1000,
        maxTimeout: 100,
      })
    );
  },
);

Deno.test(
  "retry() throws if maxTimeout is less than 0",
  async function () {
    await assertRejects(() =>
      retry(() => {}, {
        maxTimeout: -1,
      })
    );
  },
);

Deno.test(
  "retry() throws if jitter is bigger than 1",
  async function () {
    await assertRejects(() =>
      retry(() => {}, {
        jitter: 2,
      })
    );
  },
);

Deno.test("retry() checks backoff function timings", async (t) => {
  const originalMathRandom = Math.random;

  await t.step("wait fixed times without jitter", async function () {
    using time = new FakeTime();
    let resolved = false;
    const checkResolved = async () => {
      try {
        await retry(() => {
          throw new Error("Failure");
        }, { jitter: 0 });
      } catch {
        resolved = true;
      }
    };

    const promise = checkResolved();
    const startTime = time.now;

    await time.nextAsync();
    assertEquals(time.now - startTime, 1000);

    await time.nextAsync();
    assertEquals(time.now - startTime, 3000);

    await time.nextAsync();
    assertEquals(time.now - startTime, 7000);

    await time.nextAsync();
    assertEquals(time.now - startTime, 15000);
    assertEquals(resolved, false);

    await time.runMicrotasks();
    assertEquals(time.now - startTime, 15000);
    assertEquals(resolved, true);

    await time.runAllAsync();
    assertEquals(time.now - startTime, 15000);
    await promise;
  });

  Math.random = originalMathRandom;
});
