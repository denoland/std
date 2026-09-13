// Copyright 2018-2026 the Deno authors. MIT license.
import {
  exponentialBackoff,
  type ExponentialBackoffOptions,
} from "@std/async/unstable-backoff";
import { exponentialBackoffWithJitter } from "./_util.ts";
import { assert, assertEquals, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";

// `Math.random()` returns a value in [0, 1), so this is the largest sample a
// caller can ever observe.
const HIGHEST_SAMPLE = 1 - Number.EPSILON;

Deno.test("exponentialBackoff() applies the documented defaults", () => {
  using _ = stub(Math, "random", () => 0.5);

  assertEquals(exponentialBackoff(0, { jitter: 0 }), 1000);
  assertEquals(exponentialBackoff(3, { jitter: 0 }), 8000);

  assertEquals(exponentialBackoff(3), 4000);
  assertEquals(exponentialBackoff(3, {}), 4000);
  // Explicit `undefined` is outside the type contract under
  // `exactOptionalPropertyTypes`, but JavaScript callers can still pass it.
  const explicitUndefined = {
    multiplier: undefined,
    maxTimeout: undefined,
    minTimeout: undefined,
    jitter: undefined,
  } as unknown as ExponentialBackoffOptions;
  assertEquals(exponentialBackoff(3, explicitUndefined), 4000);
});

Deno.test("exponentialBackoff() caps the delay before applying jitter", () => {
  using _ = stub(Math, "random", () => 0.5);

  assertEquals(exponentialBackoff(10, { jitter: 0 }), 60000);
  assertEquals(exponentialBackoff(10), 30000);
});

Deno.test("exponentialBackoff() scales the random sample by jitter", () => {
  const cases: [jitter: number, sample: number, expected: number][] = [
    [0, 0, 1000],
    [0, 0.5, 1000],
    [0, HIGHEST_SAMPLE, 1000],
    [0.5, 0, 1000],
    [0.5, 0.5, 750],
    [0.5, HIGHEST_SAMPLE, 500.0000000000001],
    [1, 0, 1000],
    [1, 0.5, 500],
    [1, HIGHEST_SAMPLE, 2.220446049250313e-13],
  ];

  for (const [jitter, sample, expected] of cases) {
    using _ = stub(Math, "random", () => sample);
    assertEquals(
      exponentialBackoff(0, { minTimeout: 1000, jitter }),
      expected,
      `jitter ${jitter}, sample ${sample}`,
    );
  }
});

Deno.test("exponentialBackoff() rounds at the edges of the jitter range", () => {
  // The documented range `((1 - jitter) * delay, delay]` is the exact-arithmetic
  // one: rounding can land on the excluded lower bound.
  {
    using _ = stub(Math, "random", () => HIGHEST_SAMPLE);
    assertEquals(exponentialBackoff(0, { minTimeout: 1, jitter: 0.1 }), 0.9);
  }

  // A subnormal delay can underflow to zero.
  {
    using _ = stub(Math, "random", () => 0.5);
    const actual = exponentialBackoff(0, {
      minTimeout: Number.MIN_VALUE,
      jitter: 1,
    });
    assert(Object.is(actual, 0), `got ${actual}`);
  }
});

Deno.test("exponentialBackoff() handles other valid options", () => {
  using _ = stub(Math, "random", () => 0.5);

  // A multiplier of 1 makes the delay constant.
  assertEquals(
    exponentialBackoff(0, { minTimeout: 100, multiplier: 1, jitter: 0 }),
    100,
  );
  assertEquals(
    exponentialBackoff(5, { minTimeout: 100, multiplier: 1, jitter: 0 }),
    100,
  );

  const fractional = {
    minTimeout: 1.5,
    maxTimeout: 10.5,
    multiplier: 1.5,
    jitter: 0,
  };
  assertEquals(exponentialBackoff(2, fractional), 3.375);
  assertEquals(exponentialBackoff(5, fractional), 10.5);

  const equalTimeouts = { minTimeout: 500, maxTimeout: 500, jitter: 0 };
  assertEquals(exponentialBackoff(0, equalTimeouts), 500);
  assertEquals(exponentialBackoff(3, equalTimeouts), 500);
});

Deno.test("exponentialBackoff() returns positive zero for a zero base", () => {
  using _ = stub(Math, "random", () => 0.5);

  for (const maxTimeout of [1000, Infinity]) {
    for (const attempt of [0, 1024]) {
      for (const jitter of [0, 1]) {
        const actual = exponentialBackoff(attempt, {
          minTimeout: 0,
          maxTimeout,
          jitter,
        });
        assert(
          Object.is(actual, 0),
          `attempt ${attempt}, maxTimeout ${maxTimeout}, jitter ${jitter}: got ${actual}`,
        );
      }
    }
  }
});

Deno.test("exponentialBackoff() validates options with a zero base", () => {
  assertThrows(
    () => exponentialBackoff(-1, { minTimeout: 0 }),
    RangeError,
    "Cannot calculate backoff as 'attempt' must be a non-negative safe integer: current value is -1",
  );
  assertThrows(
    () => exponentialBackoff(0, { minTimeout: 0, jitter: 2 }),
    RangeError,
    "Cannot calculate backoff as 'jitter' must be between 0 and 1: current value is 2",
  );
});

Deno.test("exponentialBackoff() handles an overflowing exponent", () => {
  using _ = stub(Math, "random", () => 0.5);

  assertEquals(exponentialBackoff(1024, { minTimeout: 1, jitter: 0 }), 60000);
  assertEquals(
    exponentialBackoff(1024, {
      minTimeout: 1,
      maxTimeout: Infinity,
      jitter: 0,
    }),
    Infinity,
  );
});

// Not a guarantee: this records a limitation inherited from the shared helper,
// so that retry() and exponentialBackoff() stay in step. `multiplier ** attempt`
// overflows before the multiplication by the base, so a base below roughly
// `maxTimeout / 1.8e308` yields the cap instead of the much smaller exact delay.
Deno.test("exponentialBackoff() inherits the helper's premature overflow", () => {
  using _ = stub(Math, "random", () => 0.5);

  const tiny = { minTimeout: Number.MIN_VALUE, jitter: 0 };
  assertEquals(exponentialBackoff(1024, tiny), 60000);
  assertEquals(
    exponentialBackoff(1024, { ...tiny, maxTimeout: Infinity }),
    Infinity,
  );
});

Deno.test("exponentialBackoff() throws on an invalid attempt", () => {
  for (
    const attempt of [
      -1,
      -0.5,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
      NaN,
      Infinity,
      -Infinity,
    ]
  ) {
    assertThrows(
      () => exponentialBackoff(attempt),
      RangeError,
      `Cannot calculate backoff as 'attempt' must be a non-negative safe integer: current value is ${attempt}`,
    );
  }
});

Deno.test("exponentialBackoff() accepts option endpoints", () => {
  using _ = stub(Math, "random", () => 0.5);

  assertEquals(exponentialBackoff(1, { multiplier: 1, jitter: 0 }), 1000);
  assertEquals(
    exponentialBackoff(0, { maxTimeout: Infinity, jitter: 0 }),
    1000,
  );
  assertEquals(exponentialBackoff(0, { minTimeout: 0, jitter: 0 }), 0);
  assertEquals(exponentialBackoff(0, { jitter: 0 }), 1000);
  assertEquals(exponentialBackoff(0, { jitter: 1 }), 500);
});

Deno.test("exponentialBackoff() throws on an invalid multiplier", () => {
  for (const multiplier of [0, 0.999, -1, NaN, Infinity, -Infinity]) {
    assertThrows(
      () => exponentialBackoff(0, { multiplier }),
      RangeError,
      `Cannot calculate backoff as 'multiplier' must be a finite number >= 1: current value is ${multiplier}`,
    );
  }
});

Deno.test("exponentialBackoff() throws on an invalid maxTimeout", () => {
  for (const maxTimeout of [0, -1, NaN, -Infinity]) {
    assertThrows(
      () => exponentialBackoff(0, { maxTimeout }),
      RangeError,
      `Cannot calculate backoff as 'maxTimeout' must be a positive number: current value is ${maxTimeout}`,
    );
  }
});

Deno.test("exponentialBackoff() throws on an invalid minTimeout", () => {
  for (const minTimeout of [-1, NaN, Infinity, -Infinity]) {
    assertThrows(
      () => exponentialBackoff(0, { minTimeout, maxTimeout: Infinity }),
      RangeError,
      `Cannot calculate backoff as 'minTimeout' must be a finite number >= 0: current value is ${minTimeout}`,
    );
  }
});

Deno.test("exponentialBackoff() throws when minTimeout exceeds maxTimeout", () => {
  assertThrows(
    () => exponentialBackoff(0, { minTimeout: 2, maxTimeout: 1 }),
    RangeError,
    "Cannot calculate backoff as 'minTimeout' must be <= 'maxTimeout': current values 'minTimeout=2', 'maxTimeout=1'",
  );
});

Deno.test("exponentialBackoff() throws on an invalid jitter", () => {
  for (const jitter of [-0.1, 1.1, NaN, Infinity, -Infinity]) {
    assertThrows(
      () => exponentialBackoff(0, { jitter }),
      RangeError,
      `Cannot calculate backoff as 'jitter' must be between 0 and 1: current value is ${jitter}`,
    );
  }
});

Deno.test("exponentialBackoff() matches the shared helper", () => {
  using _ = stub(Math, "random", () => 0.25);

  const cases: ExponentialBackoffOptions[] = [
    {},
    { jitter: 0 },
    { minTimeout: 100, maxTimeout: 5000, multiplier: 3, jitter: 0.4 },
    { minTimeout: 0.5, maxTimeout: Infinity, multiplier: 1.25, jitter: 1 },
  ];

  for (const options of cases) {
    const {
      multiplier = 2,
      maxTimeout = 60000,
      minTimeout = 1000,
      jitter = 1,
    } = options;
    for (const attempt of [0, 1, 7, 40]) {
      assertEquals(
        exponentialBackoff(attempt, options),
        exponentialBackoffWithJitter(
          maxTimeout,
          minTimeout,
          attempt,
          multiplier,
          jitter,
        ),
        `attempt ${attempt}, options ${JSON.stringify(options)}`,
      );
    }
  }
});
