// Copyright 2018-2026 the Deno authors. MIT license.
import { retry, RetryError } from "./retry.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { FakeTime } from "@std/testing/time";

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

Deno.test("retry()", async () => {
  const threeErrors = generateErroringFunction(3);
  const result = await retry(threeErrors, {
    minTimeout: 1,
  });
  assertEquals(result, 3);
});

Deno.test("retry() fails after five errors by default", async () => {
  const fiveErrors = generateErroringFunction(5);
  await assertRejects(() =>
    retry(fiveErrors, {
      minTimeout: 1,
    })
  );
});

Deno.test("retry() fails after five errors when undefined is passed", async () => {
  const fiveErrors = generateErroringFunction(5);
  await assertRejects(() =>
    // @ts-expect-error: explicitly giving undefined
    retry(fiveErrors, {
      maxAttempts: undefined,
      minTimeout: 1,
    })
  );
});

Deno.test("RetryError contains the last error as cause", async () => {
  const specificError = new Error("Specific failure");
  const error = await assertRejects(
    () =>
      retry(() => {
        throw specificError;
      }, { maxAttempts: 1 }),
    RetryError,
  );
  assertEquals(error.cause, specificError);
  assertEquals(error.name, "RetryError");
  assertEquals(error.message, "Retrying exceeded the maxAttempts (1).");
});

Deno.test("retry() waits four times by default", async () => {
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
  "retry() throws if minTimeout is greater than maxTimeout",
  async () => {
    await assertRejects(
      () =>
        retry(() => {}, {
          minTimeout: 1000,
          maxTimeout: 100,
        }),
      RangeError,
      "Cannot retry as 'minTimeout' must be <= 'maxTimeout': current values 'minTimeout=1000', 'maxTimeout=100'",
    );
  },
);

Deno.test(
  "retry() throws if maxTimeout is less than or equal to 0",
  async () => {
    await assertRejects(
      () =>
        retry(() => {}, {
          maxTimeout: -1,
        }),
      RangeError,
      "Cannot retry as 'maxTimeout' must be a positive number: current value is -1",
    );
  },
);

Deno.test(
  "retry() throws if jitter is greater than 1",
  async () => {
    await assertRejects(
      () =>
        retry(() => {}, {
          jitter: 2,
        }),
      RangeError,
      "Cannot retry as 'jitter' must be between 0 and 1: current value is 2",
    );
  },
);

Deno.test(
  "retry() throws if maxAttempts is 0",
  async () => {
    await assertRejects(
      () => retry(() => {}, { maxAttempts: 0 }),
      RangeError,
      "Cannot retry as 'maxAttempts' must be a positive integer: current value is 0",
    );
  },
);

Deno.test(
  "retry() throws if maxAttempts is not an integer",
  async () => {
    await assertRejects(
      () => retry(() => {}, { maxAttempts: 2.5 }),
      RangeError,
      "Cannot retry as 'maxAttempts' must be a positive integer: current value is 2.5",
    );
  },
);

Deno.test("retry() respects custom maxAttempts", async () => {
  let attempts = 0;
  const error = await assertRejects(
    () =>
      retry(() => {
        attempts++;
        throw new Error();
      }, {
        maxAttempts: 3,
        minTimeout: 1,
      }),
    RetryError,
    "Retrying exceeded the maxAttempts (3).",
  );
  assertEquals(attempts, 3);
  assertEquals(error.message, "Retrying exceeded the maxAttempts (3).");
});

Deno.test(
  "retry() throws if multiplier is less than 1",
  async () => {
    await assertRejects(
      () => retry(() => {}, { multiplier: 0.5 }),
      RangeError,
      "Cannot retry as 'multiplier' must be >= 1: current value is 0.5",
    );
  },
);

Deno.test(
  "retry() throws if minTimeout is negative",
  async () => {
    await assertRejects(
      () => retry(() => {}, { minTimeout: -100 }),
      RangeError,
      "Cannot retry as 'minTimeout' must be >= 0: current value is -100",
    );
  },
);

Deno.test(
  "retry() throws if jitter is negative",
  async () => {
    await assertRejects(
      () => retry(() => {}, { jitter: -0.5 }),
      RangeError,
      "Cannot retry as 'jitter' must be between 0 and 1: current value is -0.5",
    );
  },
);

Deno.test(
  "retry() throws if maxTimeout is NaN",
  async () => {
    await assertRejects(
      () => retry(() => {}, { maxTimeout: NaN }),
      RangeError,
      "Cannot retry as 'maxTimeout' must be a positive number: current value is NaN",
    );
  },
);

Deno.test("retry() checks backoff function timings", async (t) => {
  const originalMathRandom = Math.random;

  await t.step("wait fixed times without jitter", async () => {
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

Deno.test("retry() caps backoff at maxTimeout", async () => {
  using time = new FakeTime();
  const promise = retry(() => {
    throw new Error();
  }, {
    minTimeout: 1000,
    maxTimeout: 1500, // Should cap at 1500, not grow to 2000, 4000, etc.
    multiplier: 2,
    jitter: 0,
  });

  const startTime = time.now;
  await time.nextAsync(); // 1000ms (1000 * 2^0)
  assertEquals(time.now - startTime, 1000);

  await time.nextAsync(); // 1500ms capped (would be 2000)
  assertEquals(time.now - startTime, 2500);

  await time.nextAsync(); // 1500ms capped (would be 4000)
  assertEquals(time.now - startTime, 4000);

  await time.nextAsync(); // 1500ms capped (would be 8000)
  assertEquals(time.now - startTime, 5500);

  await assertRejects(() => promise, RetryError);
});
