// Copyright 2018-2026 the Deno authors. MIT license.

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
  type CircuitState,
} from "./unstable_circuit_breaker.ts";

Deno.test("CircuitBreaker() throws for invalid failureThreshold", () => {
  assertThrows(
    () => new CircuitBreaker({ failureThreshold: 0 }),
    RangeError,
    '"failureThreshold" must be a finite number >= 1',
  );
  assertThrows(
    () => new CircuitBreaker({ failureThreshold: -1 }),
    RangeError,
    '"failureThreshold" must be a finite number >= 1',
  );
  assertThrows(
    () => new CircuitBreaker({ failureThreshold: NaN }),
    RangeError,
    '"failureThreshold" must be a finite number >= 1',
  );
  assertThrows(
    () => new CircuitBreaker({ failureThreshold: Infinity }),
    RangeError,
    '"failureThreshold" must be a finite number >= 1',
  );
});

Deno.test("CircuitBreaker() throws for invalid cooldownMs", () => {
  assertThrows(
    () => new CircuitBreaker({ cooldownMs: -1 }),
    RangeError,
    '"cooldownMs" must be a finite non-negative number',
  );
  assertThrows(
    () => new CircuitBreaker({ cooldownMs: NaN }),
    RangeError,
    '"cooldownMs" must be a finite non-negative number',
  );
  assertThrows(
    () => new CircuitBreaker({ cooldownMs: Infinity }),
    RangeError,
    '"cooldownMs" must be a finite non-negative number',
  );
});

Deno.test("CircuitBreaker() defaults produce closed state", () => {
  const breaker = new CircuitBreaker();
  assertEquals(breaker.state, "closed");
});

Deno.test("CircuitBreaker.execute() returns result on success", async () => {
  const breaker = new CircuitBreaker();
  const result = await breaker.execute(() => Promise.resolve("success"));
  assertEquals(result, "success");
  assertEquals(breaker.state, "closed");
});

Deno.test("CircuitBreaker.execute() throws on failure", async () => {
  const breaker = new CircuitBreaker();
  const error = new Error("test error");

  await assertRejects(
    () => breaker.execute(() => Promise.reject(error)),
    Error,
    "test error",
  );
});

Deno.test("CircuitBreaker.execute() opens circuit after reaching failure threshold", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 3 });
  const error = new Error("fail");

  // First two failures - still closed
  for (let i = 0; i < 2; i++) {
    try {
      await breaker.execute(() => Promise.reject(error));
    } catch { /* expected */ }
  }
  assertEquals(breaker.state, "closed");

  // Third failure - opens the circuit
  try {
    await breaker.execute(() => Promise.reject(error));
  } catch { /* expected */ }

  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker.execute() throws CircuitBreakerOpenError when open", async () => {
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
    "Circuit breaker is open: retry after",
  );
  assertInstanceOf(openError, CircuitBreakerOpenError);
  assert(openError.remainingCooldownMs > 0);
});

Deno.test("CircuitBreaker.execute() transitions to half_open after cooldown", async () => {
  using time = new FakeTime();

  let halfOpenCalled = false;
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 1,
    onHalfOpen: () => {
      halfOpenCalled = true;
    },
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
  assertEquals(halfOpenCalled, false);

  // Advance time past cooldown
  time.tick(1001);

  // execute() resolves time-based transitions
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "closed");
  assertEquals(halfOpenCalled, true);
});

Deno.test("CircuitBreaker.state does not trigger transitions", async () => {
  using time = new FakeTime();

  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 1,
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
  assertEquals(transitions, [["closed", "open"]]);

  // Advance time past cooldown
  time.tick(1001);

  // Reading state should NOT trigger transition or callbacks
  assertEquals(breaker.state, "open"); // Still shows "open" (stale)
  assertEquals(transitions.length, 1); // No new transitions

  // Reading state multiple times should still not trigger
  breaker.state;
  breaker.state;
  assertEquals(transitions.length, 1);

  // Only execute() triggers the transition
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "closed");
  assertEquals(transitions, [
    ["closed", "open"],
    ["open", "half_open"],
    ["half_open", "closed"],
  ]);
});

Deno.test("CircuitBreaker.execute() closes from half_open after success threshold", async () => {
  using time = new FakeTime();

  let closeCalled = false;
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    successThreshold: 2,
    onClose: () => {
      closeCalled = true;
    },
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half_open via execute after cooldown
  time.tick(1001);

  // First success (also triggers half_open transition)
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "half_open");
  assertEquals(closeCalled, false);

  // Second success - should close
  await breaker.execute(() => Promise.resolve("ok"));
  assertEquals(breaker.state, "closed");
  assertEquals(closeCalled, true);
});

Deno.test("CircuitBreaker.execute() reopens from half_open on failure", async () => {
  using time = new FakeTime();

  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Enter half_open via execute after cooldown, then fail
  time.tick(1001);

  // Failure in half_open should reopen (execute triggers half_open transition first)
  try {
    await breaker.execute(() => Promise.reject(new Error("fail again")));
  } catch { /* expected */ }

  assertEquals(breaker.state, "open");
  assertEquals(transitions, [
    ["closed", "open"],
    ["open", "half_open"],
    ["half_open", "open"],
  ]);
});

Deno.test("CircuitBreaker.forceOpen() opens the circuit and invokes onOpen", () => {
  const openCalls: number[] = [];
  const breaker = new CircuitBreaker({
    onOpen: (count) => openCalls.push(count),
  });
  assertEquals(breaker.state, "closed");

  breaker.forceOpen();
  assertEquals(breaker.state, "open");
  assertEquals(openCalls, [0]); // No failures recorded, so count is 0
});

Deno.test("CircuitBreaker.forceClose() closes the circuit and invokes onClose", async () => {
  let closeCalled = false;
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    onClose: () => {
      closeCalled = true;
    },
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  breaker.forceClose();
  assertEquals(breaker.state, "closed");
  assertEquals(closeCalled, true);
});

Deno.test("CircuitBreaker.reset() resets to initial state", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 1 });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  breaker.reset();
  assertEquals(breaker.state, "closed");
});

Deno.test("CircuitBreaker.execute() filters errors with isFailure predicate", async () => {
  const failures: Array<{ error: unknown; count: number }> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 2,
    // Only count TypeError as failures (inverted from typical use for testing)
    isFailure: (error) => !(error instanceof TypeError),
    onFailure: (error, count) => failures.push({ error, count }),
  });

  // TypeError should not be recorded (isFailure returns false)
  const typeError = new TypeError("ignored");
  try {
    await breaker.execute(() => Promise.reject(typeError));
  } catch { /* expected */ }
  assertEquals(failures.length, 0);
  assertEquals(breaker.state, "closed");

  // Regular Error should be recorded (isFailure returns true)
  const regularError = new Error("counted");
  try {
    await breaker.execute(() => Promise.reject(regularError));
  } catch { /* expected */ }
  assertEquals(failures.length, 1);
  assertEquals(breaker.state, "closed");

  // Second regular Error should open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("counted2")));
  } catch { /* expected */ }
  assertEquals(failures.length, 2);
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker.execute() counts successful results as failures via isResultFailure", async () => {
  const breaker = new CircuitBreaker<number>({
    failureThreshold: 1,
    isResultFailure: (result) => result < 0,
  });

  // Positive result - success
  const result1 = await breaker.execute(() => Promise.resolve(42));
  assertEquals(result1, 42);
  assertEquals(breaker.state, "closed");

  // Negative result - counts as failure but still returns
  const result2 = await breaker.execute(() => Promise.resolve(-1));
  assertEquals(result2, -1);
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker.execute() prunes failures outside the failure window", async () => {
  using time = new FakeTime();

  const failures: number[] = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    failureWindowMs: 1000,
    onFailure: (_error, count) => failures.push(count),
  });

  // Two failures
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(failures, [1, 2]);

  // Advance past window
  time.tick(1001);

  // Old failures should be pruned - next failure starts at count 1
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(failures, [1, 2, 1]); // Reset to 1 after window expired
  assertEquals(breaker.state, "closed");

  // Two more failures should open (total 3 in new window)
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker.execute() never prunes failures when failureWindowMs is 0", async () => {
  using time = new FakeTime();

  const failures: number[] = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    failureWindowMs: 0, // Disabled - failures never expire
    onFailure: (_error, count) => failures.push(count),
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

  // One more should open (failures persisted since window is disabled)
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(failures, [1, 2, 3]); // Count continues from 2
  assertEquals(breaker.state, "open");
});

Deno.test("CircuitBreaker.execute() invokes onFailure callback", async () => {
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

Deno.test("CircuitBreaker.execute() invokes onOpen callback", async () => {
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

Deno.test("CircuitBreaker.execute() limits concurrent requests in half_open", async () => {
  using time = new FakeTime();

  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    halfOpenMaxConcurrent: 1,
    successThreshold: 2,
  });

  // Open
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Advance past cooldown
  time.tick(1001);

  // Start a slow request (this triggers half_open transition)
  let resolveFirst: (() => void) | undefined;
  const firstPromise = breaker.execute(
    () =>
      new Promise<string>((resolve) => {
        resolveFirst = () => resolve("first");
      }),
  );

  // Second request should be rejected (at max concurrent)
  await assertRejects(
    () => breaker.execute(() => Promise.resolve("second")),
    CircuitBreakerOpenError,
  );

  // Complete first request
  resolveFirst?.();
  await firstPromise;
});

Deno.test("CircuitBreaker.execute() prevents stale half_open success from closing after concurrent failure", async () => {
  using time = new FakeTime();

  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    halfOpenMaxConcurrent: 2,
    successThreshold: 1,
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  // Advance past cooldown
  time.tick(1001);

  // Start two concurrent half-open requests
  let resolveA: (() => void) | undefined;
  let rejectB: ((err: Error) => void) | undefined;

  const promiseA = breaker.execute(
    () =>
      new Promise<string>((r) => {
        resolveA = () => r("ok");
      }),
  );
  const promiseB = breaker.execute(
    () =>
      new Promise<string>((_r, rej) => {
        rejectB = (e) => rej(e);
      }),
  );

  // B fails first — this should reopen the circuit
  rejectB?.(new Error("still broken"));
  try {
    await promiseB;
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");

  // A succeeds after B already opened the circuit
  resolveA?.();
  await promiseA;

  // Circuit must remain open — the stale success must not close it
  assertEquals(breaker.state, "open");
  assertEquals(transitions, [
    ["closed", "open"],
    ["open", "half_open"],
    ["half_open", "open"],
  ]);
});

Deno.test("CircuitBreaker.execute() reopens circuit via isResultFailure in half_open", async () => {
  using time = new FakeTime();

  const transitions: Array<[CircuitState, CircuitState]> = [];
  const breaker = new CircuitBreaker<number>({
    failureThreshold: 1,
    cooldownMs: 1000,
    isResultFailure: (result) => result < 0,
    onStateChange: (from, to) => transitions.push([from, to]),
  });

  // Open the circuit with a thrown error
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }

  // Advance past cooldown
  time.tick(1001);

  // Result failure in half-open should reopen (execute triggers half_open first)
  const result = await breaker.execute(() => Promise.resolve(-1));
  assertEquals(result, -1); // Still returns the result
  assertEquals(breaker.state, "open"); // But circuit is reopened
  assertEquals(transitions, [
    ["closed", "open"],
    ["open", "half_open"],
    ["half_open", "open"],
  ]);
});

Deno.test("CircuitBreakerOpenError() has correct properties", () => {
  const error = new CircuitBreakerOpenError(5000);

  assertEquals(error.name, "CircuitBreakerOpenError");
  assertEquals(error.remainingCooldownMs, 5000);
  assert(error.message.includes("5000ms"));
  assertInstanceOf(error, Error);
});

Deno.test("CircuitBreaker.forceOpen() and forceClose() deduplicate repeated calls", () => {
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

Deno.test("CircuitBreaker.reset() silently resets without invoking callbacks", async () => {
  const transitions: Array<[CircuitState, CircuitState]> = [];
  let closeCalled = false;
  const breaker = new CircuitBreaker({
    failureThreshold: 1,
    onStateChange: (from, to) => transitions.push([from, to]),
    onClose: () => closeCalled = true,
  });

  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch { /* expected */ }
  assertEquals(breaker.state, "open");
  assertEquals(transitions, [["closed", "open"]]);

  // Reset should NOT trigger any callbacks (silent reset)
  breaker.reset();
  assertEquals(breaker.state, "closed");
  assertEquals(transitions, [["closed", "open"]]); // No new transition
  assertEquals(closeCalled, false); // onClose not called
});

Deno.test("CircuitBreaker.execute() rejects immediately if signal already aborted", async () => {
  const breaker = new CircuitBreaker();
  const controller = new AbortController();
  controller.abort();

  let fnCalled = false;
  await assertRejects(
    () =>
      breaker.execute(() => {
        fnCalled = true;
        return Promise.resolve("ignored");
      }, { signal: controller.signal }),
    DOMException,
    "aborted",
  );

  // Function should never have been called
  assertEquals(fnCalled, false);
  // Circuit should remain closed (no failure recorded)
  assertEquals(breaker.state, "closed");
});

Deno.test("CircuitBreaker.execute() does not mask original error when onFailure throws", async () => {
  const transitions: Array<[CircuitState, CircuitState]> = [];
  const openCalls: number[] = [];
  const asyncErrors: Error[] = [];
  const callbackError = new Error("callback bug");

  // Intercept the asynchronously re-thrown callback error
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    asyncErrors.push(event.error);
  };
  globalThis.addEventListener("error", onError);

  try {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      onFailure: () => {
        throw callbackError;
      },
      onStateChange: (from, to) => transitions.push([from, to]),
      onOpen: (count) => openCalls.push(count),
    });

    // The original error must propagate, not the callback error
    const originalError = new Error("service down");
    await assertRejects(
      () => breaker.execute(() => Promise.reject(originalError)),
      Error,
      "service down",
    );

    // Flush the microtask queue so the async error is delivered
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    // Circuit must still have opened
    assertEquals(breaker.state, "open");

    // onStateChange and onOpen must still have been called despite onFailure throwing
    assertEquals(transitions, [["closed", "open"]]);
    assertEquals(openCalls, [1]);

    // The callback error was reported asynchronously
    assertEquals(asyncErrors.length, 1);
    assertEquals(asyncErrors[0], callbackError);
  } finally {
    globalThis.removeEventListener("error", onError);
  }
});
