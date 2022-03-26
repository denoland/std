/** This module is browser compatible. */

import {
  assertEquals,
  AssertionError,
  assertIsError,
  assertRejects,
} from "../asserts.ts";
import { Spy, SpyCall } from "./mock.ts";

/** An error related to spying on a function or instance method. */
export class MockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MockError";
  }
}

/**
 * Asserts that a spy is called as much as expected and no more.
 */
export function assertSpyCalls<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: Spy<Self, Args, Return>,
  expectedCalls: number,
) {
  try {
    assertEquals(spy.calls.length, expectedCalls);
  } catch (e) {
    assertIsError(e);
    let message = spy.calls.length < expectedCalls
      ? "spy not called as much as expected:\n"
      : "spy called more than expected:\n";
    message += e.message.split("\n").slice(1).join("\n");
    throw new AssertionError(message);
  }
}

/** Call information recorded by a spy. */
export interface ExpectedSpyCall<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> {
  /** Arguments passed to a function when called. */
  args?: [...Args, ...unknown[]];
  /** The instance that a method was called on. */
  self?: Self;
  /**
   * The value that was returned by a function.
   * If you expect a promise to reject, expect error instead.
   */
  returned?: Return;
  error?: {
    /** The class for the error that was thrown by a function. */
    // deno-lint-ignore no-explicit-any
    Class?: new (...args: any[]) => Error;
    /** Part of the message for the error that was thrown by a function. */
    msgIncludes?: string;
  };
}

/**
 * Asserts that a spy is called as expected.
 */
export function assertSpyCall<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: Spy<Self, Args, Return>,
  callIndex: number,
  expected?: ExpectedSpyCall<Self, Args, Return>,
) {
  if (spy.calls.length < (callIndex + 1)) {
    throw new AssertionError("spy not called as much as expected");
  }
  const call: SpyCall = spy.calls[callIndex];
  if (expected) {
    if (expected.args) {
      try {
        assertEquals(call.args, expected.args);
      } catch (e) {
        assertIsError(e);
        throw new AssertionError(
          "spy not called with expected args:\n" +
            e.message.split("\n").slice(1).join("\n"),
        );
      }
    }

    if ("self" in expected) {
      try {
        assertEquals(call.self, expected.self);
      } catch (e) {
        assertIsError(e);
        let message = expected.self
          ? "spy not called as method on expected self:\n"
          : "spy not expected to be called as method on object:\n";
        message += e.message.split("\n").slice(1).join("\n");
        throw new AssertionError(message);
      }
    }

    if ("returned" in expected) {
      if ("error" in expected) {
        throw new TypeError(
          "do not expect error and return, only one should be expected",
        );
      }
      if (call.error) {
        throw new AssertionError(
          "spy call did not return expected value, an error was thrown.",
        );
      }
      try {
        assertEquals(call.returned, expected.returned);
      } catch (e) {
        assertIsError(e);
        throw new AssertionError(
          "spy call did not return expected value:\n" +
            e.message.split("\n").slice(1).join("\n"),
        );
      }
    }

    if ("error" in expected) {
      if ("returned" in call) {
        throw new AssertionError(
          "spy call did not throw an error, a value was returned.",
        );
      }
      assertIsError(
        call.error,
        expected.error?.Class,
        expected.error?.msgIncludes,
      );
    }
  }
}

/**
 * Asserts that an async spy is called as expected.
 */
export async function assertSpyCallAsync<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: Spy<Self, Args, Promise<Return>>,
  callIndex: number,
  expected?: ExpectedSpyCall<Self, Args, Promise<Return> | Return>,
) {
  const expectedSync = expected && { ...expected };
  if (expectedSync) {
    delete expectedSync.returned;
    delete expectedSync.error;
  }
  assertSpyCall(spy, callIndex, expectedSync);
  const call = spy.calls[callIndex];

  if (call.error) {
    throw new AssertionError(
      "spy call did not return a promise, an error was thrown.",
    );
  }
  if (call.returned !== Promise.resolve(call.returned)) {
    throw new AssertionError(
      "spy call did not return a promise, a value was returned.",
    );
  }

  if (expected) {
    if ("returned" in expected) {
      if ("error" in expected) {
        throw new TypeError(
          "do not expect error and return, only one should be expected",
        );
      }
      if (call.error) {
        throw new AssertionError(
          "spy call did not return expected value, an error was thrown.",
        );
      }
      let expectedResolved;
      try {
        expectedResolved = await expected.returned;
      } catch {
        throw new TypeError(
          "do not expect rejected promise, expect error instead",
        );
      }

      let resolved;
      try {
        resolved = await call.returned;
      } catch {
        throw new AssertionError("spy call returned promise was rejected");
      }

      try {
        assertEquals(resolved, expectedResolved);
      } catch (e) {
        assertIsError(e);
        throw new AssertionError(
          "spy call did not resolve to expected value:\n" +
            e.message.split("\n").slice(1).join("\n"),
        );
      }
    }

    if ("error" in expected) {
      await assertRejects(
        () => Promise.resolve(call.returned),
        expected.error?.Class ?? Error,
        expected.error?.msgIncludes ?? "",
      );
    }
  }
}

/**
 * Asserts that a spy is called with a specific arg as expected.
 */
export function assertSpyCallArg<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArg,
>(
  spy: Spy<Self, Args, Return>,
  callIndex: number,
  argIndex: number,
  expected: ExpectedArg,
): ExpectedArg {
  assertSpyCall(spy, callIndex);
  const call = spy.calls[callIndex];
  const arg = call.args[argIndex];
  assertEquals(arg, expected);
  return arg as ExpectedArg;
}

/**
 * Asserts that an spy is called with a specific range of args as expected.
 * If a start and end index is not provided, the expected will be compared against all args.
 * If a start is provided without an end index, the expected will be compared against all args from the start index to the end.
 * The end index is not included in the range of args that are compared.
 */
export function assertSpyCallArgs<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArgs extends unknown[],
>(
  spy: Spy<Self, Args, Return>,
  callIndex: number,
  expected: ExpectedArgs,
): ExpectedArgs;
export function assertSpyCallArgs<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArgs extends unknown[],
>(
  spy: Spy<Self, Args, Return>,
  callIndex: number,
  argsStart: number,
  expected: ExpectedArgs,
): ExpectedArgs;
export function assertSpyCallArgs<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArgs extends unknown[],
>(
  spy: Spy<Self, Args, Return>,
  callIndex: number,
  argStart: number,
  argEnd: number,
  expected: ExpectedArgs,
): ExpectedArgs;
export function assertSpyCallArgs<
  ExpectedArgs extends unknown[],
  Args extends unknown[],
  Return,
  Self,
>(
  spy: Spy<Self, Args, Return>,
  callIndex: number,
  argsStart?: number | ExpectedArgs,
  argsEnd?: number | ExpectedArgs,
  expected?: ExpectedArgs,
): ExpectedArgs {
  assertSpyCall(spy, callIndex);
  const call = spy.calls[callIndex];
  if (!expected) {
    expected = argsEnd as ExpectedArgs;
    argsEnd = undefined;
  }
  if (!expected) {
    expected = argsStart as ExpectedArgs;
    argsStart = undefined;
  }
  const args = typeof argsEnd === "number"
    ? call.args.slice(argsStart as number, argsEnd)
    : typeof argsStart === "number"
    ? call.args.slice(argsStart)
    : call.args;
  assertEquals(args, expected);
  return args as ExpectedArgs;
}
