// Copyright 2018-2025 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { FakeTime } from "@std/testing/time";
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  type CircuitBreakerStats,
  type CircuitState,
} from "./unstable_circuit_breaker.ts";

Deno.test("CircuitBreaker constructor throws for invalid failureThreshold", () => {
  assertThrows(
    () => new CircuitBreaker({ failureThreshold: 0 }),
    TypeError,
    "'failureThreshold' must be at least 1",
  );
  assertThrows(
    () => new CircuitBreaker({ failureThreshold: -1 }),
    TypeError,
    "'failureThreshold' must be at least 1",
  );
});

Deno.test("CircuitBreaker constructor throws for invalid cooldownMs", () => {
  assertThrows(
    () => new CircuitBreaker({ cooldownMs: -1 }),
    TypeError,
    "'cooldownMs' must be non-negative",
  );
});

Deno.test("CircuitBreaker constructor throws for invalid successThreshold", () => {
  assertThrows(
    () => new CircuitBreaker({ successThreshold: 0 }),
    TypeError,
    "'successThreshold' must be at least 1",
  );
});

Deno.test("CircuitBreaker constructor throws for invalid halfOpenMaxConcurrent", () => {
  assertThrows(
    () => new CircuitBreaker({ halfOpenMaxConcurrent: 0 }),
    TypeError,
    "'halfOpenMaxConcurrent' must be at least 1",
  );
});

Deno.test("CircuitBreaker constructor throws for invalid failureWindowMs", () => {
  assertThrows(
    () => new CircuitBreaker({ failureWindowMs: -1 }),
    TypeError,
    "'failureWindowMs' must be non-negative",
  );
});

Deno.test("CircuitBreaker constructor defaults work correctly", () => {
  const breaker = new CircuitBreaker();
  assertEquals(breaker.state, "closed");
  assertEquals(breaker.failureCount, 0);
  assertEquals(breaker.isAvailable, true);
});

Deno.test("CircuitBreaker.execute() returns result on success", async () => {
  const breaker = new CircuitBreaker();
  const result = await breaker.execute(() => Promise.resolve("success"));
  assertEquals(result, "success");
  assertEquals(breaker.state, "closed");
});

Deno.test("CircuitBreaker.execute() throws and records failure", async () => {
  const breaker = new CircuitBreaker();
  const error = new Error("test error");

  await assertRejects(
    () => breaker.execute(() => Promise.reject(error)),
    Error,
    "test error",
  );

  assertEquals(breaker.failureCount, 1);
});

Deno.test("CircuitBreaker opens after reaching failure threshold", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 3 });
  const error = new Error("fail");

  // First two failures - still closed
  for (let i = 0; i < 2; i++) {
    try {
      await breaker.execute(() => Promise.reject(error));
    } catch { /* expected */ }
  }
  assertEquals(breaker.state, "closed");
  assertEquals(breaker.failureCount, 2);

  // Third failure - opens the circuit
  try {
    await breaker.execute(() => Promise.reject(error));
  } catch { /* expected */ }

  assertEquals(breaker.state, "open");
  assertEquals(breaker.isAvailable, false);
});

Deno.test("CircuitBreaker throws CircuitBreakerOpenError when open", async () => {
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 30000,
  });
  const error = new Error("fail");

  // Trigger opening
  try {
    await breaker.execute(() => Promise.reject(error));
  } catch { /* expected */ }

  assertEquals(breaker.state, "open");

  // Now execute should throw CircuitBreakerOpenError
  const openError = await assertRejects(
    () => breaker.execute(() => Promise.resolve("ignored")),
    CircuitBreakerOpenError,
    "Circuit breaker is open",
  );
  assertInstanceOf(openError, CircuitBreakerOpenError);
  assert(openError.remainingCooldownMs > 0);
});

Deno.test("CircuitBreaker transitions to half_open after cooldown", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  // Advance time past cooldown
  time.tick(1001);

  assertEquals(breaker.state, "half_open");
  assertEquals(breaker.isAvailable, true);
});

Deno.test("CircuitBreaker closes from half_open after success threshold", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 2,
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half_open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");

  // First success
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "half_open");

  // Second success - should close
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "closed");
  assertEquals(breaker.failureCount, 0);
});

Deno.test("CircuitBreaker reopens from half_open on failure", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half_open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");

  // Failure in half_open should reopen
  try {
    await breaker.execute(() => Promise.reject(new Error("fail again")));
  } catch { /* expected */ }

  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker.forceOpen() opens the circuit", () => {
  const breaker = new CircuitBreaker();
  assertEquals(breaker.state, "closed");

  breaker.forceOpen();
  assertEquals(breaker.state, "open");
  assertEquals(breaker.isAvailable, false);
});

Deno.test("CircuitBreaker.forceClose() closes the circuit and resets", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 1 });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  breaker.forceClose();
  assertEquals(breaker.state, "closed");
  assertEquals(breaker.failureCount, 0);
  assertEquals(breaker.isAvailable, true);
});

Deno.test("CircuitBreaker.reset() resets to initial state", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 3 });

  // Accumulate some failures
  for (let i = 0; i < 2; i++) {
    try {
      await breaker.execute(() => Promise.reject(new Error("fail")));
    } catch { /* expected */ }
  }
  assertEquals(breaker.failureCount, 2);

  breaker.reset();
  assertEquals(breaker.state, "closed");
  assertEquals(breaker.failureCount, 0);
});

Deno.test("CircuitBreaker.getStats() returns correct statistics", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 3 });

  let stats: CircuitBreakerStats = breaker.getStats();
  assertEquals(stats.state, "closed");
  assertEquals(stats.failureCount, 0);
  assertEquals(stats.consecutiveSuccesses, 0);
  assertEquals(stats.isAvailable, true);

  // Add a failure
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  stats = breaker.getStats();
  assertEquals(stats.failureCount, 1);
});

Deno.test("CircuitBreaker isFailure predicate filters errors", async () => {
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    // Only count TypeError as failures
    isFailure: (error) => error instanceof TypeError,
  });

  // Regular Error should not count
  try {
    await breaker.execute(() => Promise.reject(new Error("ignored")));
  } catch { /* expected */ }
  assertEquals(breaker.failureCount, 0);
  assertEquals(breaker.state, "closed");

  // TypeError should count and open circuit
  try {
    await breaker.execute(() => Promise.reject(new TypeError("counts")));
  } catch { /* expected */ }
  assertEquals(breaker.failureCount, 1);
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker isResultFailure counts successful results as failures", async () => {
  const breaker = new CircuitBreaker<number>({
    failureThreshold: 1,
    isResultFailure: (result) => result < 0,
  });

  // Positive result - success
  const result1 = await breaker.execute(() => Promise.resolve(42));
  assertEquals(result1, 42);
  assertEquals(breaker.failureCount, 0);

  // Negative result - counts as failure but still returns
  const result2 = await breaker.execute(() => Promise.resolve(-1));
  assertEquals(result2, -1);
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker failure window prunes old failures", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    failureWindowMs: 1000,
  });

  // Two failures
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.failureCount, 2);

  // Advance past window
  time.tick(1001);

  // Old failures should be pruned
  assertEquals(breaker.failureCount, 0);

  // Should now need 3 new failures to open
  for (let i = 0; i < 2; i++) {
    try {
      await breaker.execute(() => Promise.reject(new Error("fail")));
    } catch { /* expected */ }
  }
  assertEquals(breaker.state, "closed");

  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker onStateChange callback is invoked", async () => {
  using time = new FakeTime();

  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 1,
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(transitions, [["closed", "open"]]);

  // Half-open
  time.tick(1001);
  // Access state to trigger transition
  breaker.state;
  assertEquals(transitions, [["closed", "open"], ["open", "half_open"]]);

  // Close
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(transitions, [
    ["closed", "open"],
    ["open", "half_open"],
    ["half_open", "closed"],
  ]);
});

Deno.test("CircuitBreaker onFailure callback is invoked", async () => {
  const failures: Array<{ error: unknown; count: number }> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    onFailure: (error, count) => failures.push({ error, count }),
  });

  const err1 = new Error("fail1");
  const err2 = new Error("fail2");

  try {
    await breaker.execute(() => Promise.reject(err1));
  } catch { /* expected */ }
  try {
    await breaker.execute(() => Promise.reject(err2));
  } catch { /* expected */ }

  assertEquals(failures.length, 2);
  assertEquals(failures[0]?.error, err1);
  assertEquals(failures[0]?.count, 1);
  assertEquals(failures[1]?.error, err2);
  assertEquals(failures[1]?.count, 2);
});

Deno.test("CircuitBreaker onOpen callback is invoked", async () => {
  const openCalls: number[] = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 2,
    onOpen: (count) => openCalls.push(count),
  });

  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(openCalls.length, 0);

  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(openCalls, [2]);
});

Deno.test("CircuitBreaker onClose callback is invoked", async () => {
  using time = new FakeTime();

  let closeCalled = false;
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 1,
    onClose: () => {
      closeCalled = true;
    },
  });

  // Open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Half-open
  time.tick(1001);

  // Close
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(closeCalled, true);
});

Deno.test("CircuitBreaker half_open limits concurrent requests", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    halfOpenMaxConcurrent: 1,
  });

  // Open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half-open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");

  // Start a slow request
  let resolveFirst: (() => void) | undefined;
  const firstPromise = breaker.execute(
    () =>
      new Promise<string>((resolve) => {
        resolveFirst = () => resolve("first");
      }),
  );

  // Second request should be rejected
  await assertRejects(
    () => breaker.execute(() => Promise.resolve("second")),
    CircuitBreakerOpenError,
  );

  // Complete first request
  resolveFirst?.();
  await firstPromise;
});

Deno.test("CircuitBreaker with disabled failure window (0)", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    failureWindowMs: 0, // Disabled - failures never expire
  });

  // Add two failures
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Advance time significantly
  time.tick(100_000);

  // Failures should still be counted
  assertEquals(breaker.failureCount, 2);

  // One more should open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker with zero cooldown transitions immediately", async () => {
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 0,
    successThreshold: 1,
  });

  // Open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Should immediately be half_open (or allow immediate transition)
  // Since cooldown is 0, checking state should transition
  assertEquals(breaker.state, "half_open");

  // Should be able to close immediately
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "closed");
});

Deno.test("CircuitBreakerOpenError has correct properties", () => {
  const error = new CircuitBreakerOpenError(5000);

  assertEquals(error.name, "CircuitBreakerOpenError");
  assertEquals(error.remainingCooldownMs, 5000);
  assert(error.message.includes("5000ms"));
  assertInstanceOf(error, Error);
});

Deno.test("CircuitBreaker type parameter constrains isResultFailure", async () => {
  // This test verifies the generic type works correctly
  interface ApiResponse {
    status: number;
    data: string;
  }

  const breaker = new CircuitBreaker<ApiResponse>({
    failureThreshold: 1,
    isResultFailure: (response) => response.status >= 500,
  });

  const result = await breaker.execute(() =>
    Promise.resolve({ status: 200, data: "ok" })
  );
  assertEquals(result.status, 200);
  assertEquals(breaker.state, "closed");

  // 500 error counts as failure
  await breaker.execute(() => Promise.resolve({ status: 500, data: "error" }));
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker multiple force operations", () => {
  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Repeated forceOpen should only trigger one transition
  breaker.forceOpen();
  breaker.forceOpen();
  assertEquals(transitions.length, 1);

  // Repeated forceClose should only trigger one transition
  breaker.forceClose();
  breaker.forceClose();
  assertEquals(transitions.length, 2);
});

Deno.test("CircuitBreaker.forceOpen() invokes onOpen callback", () => {
  const openCalls: number[] = [];
  const breaker = new CircuitBreaker({
    onOpen: (count) => openCalls.push(count),
  });

  breaker.forceOpen();
  assertEquals(openCalls, [0]); // No failures recorded, so count is 0
});

Deno.test("CircuitBreaker.forceClose() invokes onClose callback", async () => {
  let closeCalled = false;
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    onClose: () => {
      closeCalled = true;
    },
  });

  // Open the circuit first
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  // forceClose should invoke onClose
  breaker.forceClose();
  assertEquals(closeCalled, true);
});

Deno.test("CircuitBreaker.reset() invokes onStateChange when not closed", async () => {
  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
  assertEquals(transitions, [["closed", "open"]]);

  // Reset should trigger state change callback
  breaker.reset();
  assertEquals(transitions, [["closed", "open"], ["open", "closed"]]);
});

Deno.test("CircuitBreaker.reset() does not invoke onStateChange when already closed", () => {
  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  assertEquals(breaker.state, "closed");
  breaker.reset();
  assertEquals(transitions.length, 0); // No state change callback
});

Deno.test("CircuitBreaker half_open failure invokes onStateChange and onOpen", async () => {
  using time = new FakeTime();

  const transitions: Array<[CircuitState, CircuitState]> = [];
  const openCalls: number[] = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    onStateChange: (from, to) => transitions.push([from, to]),
    onOpen: (count) => openCalls.push(count),
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
  assertEquals(transitions, [["closed", "open"]]);
  assertEquals(openCalls, [1]);

  // Enter half-open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");
  assertEquals(transitions, [["closed", "open"], ["open", "half_open"]]);

  // Failure in half-open should reopen and invoke callbacks
  try {
    await breaker.execute(() => Promise.reject(new Error("fail again")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
  assertEquals(transitions, [
    ["closed", "open"],
    ["open", "half_open"],
    ["half_open", "open"],
  ]);
  assertEquals(openCalls, [1, 2]); // Second open call with 2 failures
});

Deno.test("CircuitBreaker consecutiveSuccesses tracked in half_open getStats", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 3,
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half-open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");

  // First success
  await breaker.execute(() => Promise.resolve("ok"));
  let stats = breaker.getStats();
  assertEquals(stats.consecutiveSuccesses, 1);

  // Second success
  await breaker.execute(() => Promise.resolve("ok"));
  stats = breaker.getStats();
  assertEquals(stats.consecutiveSuccesses, 2);

  // Third success closes the circuit
  await breaker.execute(() => Promise.resolve("ok"));
  stats = breaker.getStats();
  assertEquals(stats.state, "closed");
  assertEquals(stats.consecutiveSuccesses, 0); // Reset after closing
});

Deno.test("CircuitBreaker isResultFailure in half_open reopens circuit", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker<number>({
    failureThreshold: 1,
    cooldownMs: 1000,
    isResultFailure: (result) => result < 0,
  });

  // Open the circuit with a thrown error
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half-open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");

  // Result failure in half-open should reopen
  const result = await breaker.execute(() => Promise.resolve(-1));
  assertEquals(result, -1); // Still returns the result
  assertEquals(breaker.state, "open"); // But circuit is reopened
});

Deno.test("CircuitBreaker handles multiple half_open concurrent slots", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    halfOpenMaxConcurrent: 2,
    successThreshold: 2,
  });

  // Open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half-open
  time.tick(1001);
  assertEquals(breaker.state, "half_open");
  assertEquals(breaker.isAvailable, true);

  // Start two concurrent requests (should both be allowed)
  let resolve1: (() => void) | undefined;
  let resolve2: (() => void) | undefined;
  const promise1 = breaker.execute(
    () =>
      new Promise<string>((r) => {
        resolve1 = () => r("first");
      }),
  );
  const promise2 = breaker.execute(
    () =>
      new Promise<string>((r) => {
        resolve2 = () => r("second");
      }),
  );

  // Third request should be rejected (at max concurrent)
  await assertRejects(
    () => breaker.execute(() => Promise.resolve("third")),
    CircuitBreakerOpenError,
  );

  // Complete both requests
  resolve1?.();
  resolve2?.();
  await promise1;
  await promise2;

  assertEquals(breaker.state, "closed"); // Both successes met threshold
});

Deno.test("CircuitBreaker isFailure predicate prevents failure recording", async () => {
  const failures: Array<{ error: unknown; count: number }> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 2,
    isFailure: (error) => !(error instanceof TypeError),
    onFailure: (error, count) => failures.push({ error, count }),
  });

  // TypeError should not be recorded
  const typeError = new TypeError("ignored");
  try {
    await breaker.execute(() => Promise.reject(typeError));
  } catch { /* expected */ }
  assertEquals(failures.length, 0);
  assertEquals(breaker.failureCount, 0);

  // Regular Error should be recorded
  const regularError = new Error("counted");
  try {
    await breaker.execute(() => Promise.reject(regularError));
  } catch { /* expected */ }
  assertEquals(failures.length, 1);
  assertEquals(breaker.failureCount, 1);
});
