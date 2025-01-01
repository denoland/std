// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { AssertionError } from "@std/assert/assertion-error";

import { equal } from "./_equal.ts";
import { inspectArg, inspectArgs } from "./_inspect_args.ts";
import type { MatcherContext, MatchResult } from "./_types.ts";
import { getMockCalls } from "./_unstable_mock_utils.ts";

export {
  toBe,
  toBeCloseTo,
  toBeDefined,
  toBeFalsy,
  toBeGreaterThan,
  toBeGreaterThanOrEqual,
  toBeInstanceOf,
  toBeLessThan,
  toBeLessThanOrEqual,
  toBeNaN,
  toBeNull,
  toBeTruthy,
  toBeUndefined,
  toContain,
  toContainEqual,
  toEqual,
  toHaveBeenCalled,
  toHaveBeenCalledTimes,
  toHaveLength,
  toHaveProperty,
  toMatch,
  toMatchObject,
  toStrictEqual,
  // toHaveBeenCalledWith,
  // toHaveBeenLastCalledWith,
  // toHaveBeenNthCalledWith,
  // toHaveReturned,
  // toHaveReturnedTimes,
  // toHaveReturnedWith,
  // toHaveLastReturnedWith,
  // toHaveNthReturnedWith,
  toThrow,
} from "./_matchers.ts";

export function toHaveBeenCalledWith(
  context: MatcherContext,
  ...expected: unknown[]
): MatchResult {
  const calls = getMockCalls(context.value);
  const hasBeenCalled = calls.some((call) => equal(call.args, expected));

  if (context.isNot) {
    if (hasBeenCalled) {
      const defaultMessage = `Expected mock function not to be called with ${
        inspectArgs(expected)
      }, but it was`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (!hasBeenCalled) {
      let otherCalls = "";
      if (calls.length > 0) {
        otherCalls = `\n  Other calls:\n     ${
          calls.map((call) => inspectArgs(call.args)).join("\n    ")
        }`;
      }

      const defaultMessage = `Expected mock function to be called with ${
        inspectArgs(expected)
      }, but it was not.${otherCalls}`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  }
}

export function toHaveBeenLastCalledWith(
  context: MatcherContext,
  ...expected: unknown[]
): MatchResult {
  const calls = getMockCalls(context.value);
  const hasBeenCalled = calls.length > 0 &&
    equal(calls.at(-1)?.args, expected);

  if (context.isNot) {
    if (hasBeenCalled) {
      const defaultMessage =
        `Expected mock function not to be last called with ${
          inspectArgs(expected)
        }, but it was`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (!hasBeenCalled) {
      const lastCall = calls.at(-1);
      if (!lastCall) {
        const defaultMessage = `Expected mock function to be last called with ${
          inspectArgs(expected)
        }, but it was not`;
        throw new AssertionError(
          context.customMessage
            ? `${context.customMessage}: ${defaultMessage}`
            : defaultMessage,
        );
      } else {
        const defaultMessage = `Expected mock function to be last called with ${
          inspectArgs(expected)
        }, but it was last called with ${inspectArgs(lastCall.args)}`;
        throw new AssertionError(
          context.customMessage
            ? `${context.customMessage}: ${defaultMessage}`
            : defaultMessage,
        );
      }
    }
  }
}

export function toHaveBeenNthCalledWith(
  context: MatcherContext,
  nth: number,
  ...expected: unknown[]
): MatchResult {
  if (nth < 1) {
    throw new Error(`nth must be greater than 0: received ${nth}`);
  }

  const calls = getMockCalls(context.value);
  const callIndex = nth - 1;
  const hasBeenCalled = calls.length > callIndex &&
    equal(calls[callIndex]?.args, expected);

  if (context.isNot) {
    if (hasBeenCalled) {
      const defaultMessage =
        `Expected the n-th call (n=${nth}) of mock function is not with ${
          inspectArgs(expected)
        }, but it was`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (!hasBeenCalled) {
      const nthCall = calls[callIndex];
      if (!nthCall) {
        const defaultMessage =
          `Expected the n-th call (n=${nth}) of mock function is with ${
            inspectArgs(expected)
          }, but the n-th call does not exist`;
        throw new AssertionError(
          context.customMessage
            ? `${context.customMessage}: ${defaultMessage}`
            : defaultMessage,
        );
      } else {
        const defaultMessage =
          `Expected the n-th call (n=${nth}) of mock function is with ${
            inspectArgs(expected)
          }, but it was with ${inspectArgs(nthCall.args)}`;
        throw new AssertionError(
          context.customMessage
            ? `${context.customMessage}: ${defaultMessage}`
            : defaultMessage,
        );
      }
    }
  }
}

export function toHaveReturned(context: MatcherContext): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.result === "returned");

  if (context.isNot) {
    if (returned.length > 0) {
      const defaultMessage =
        `Expected the mock function to not have returned, but it returned ${returned.length} times`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (returned.length === 0) {
      const defaultMessage =
        `Expected the mock function to have returned, but it did not return`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  }
}

export function toHaveReturnedTimes(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.result === "returned");

  if (context.isNot) {
    if (returned.length === expected) {
      const defaultMessage =
        `Expected the mock function to not have returned ${expected} times, but it returned ${returned.length} times`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (returned.length !== expected) {
      const defaultMessage =
        `Expected the mock function to have returned ${expected} times, but it returned ${returned.length} times`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  }
}

export function toHaveReturnedWith(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.result === "returned");
  const returnedWithExpected = returned.some((call) =>
    equal(call.returned, expected)
  );

  if (context.isNot) {
    if (returnedWithExpected) {
      const defaultMessage =
        `Expected the mock function to not have returned with ${
          inspectArg(expected)
        }, but it did`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (!returnedWithExpected) {
      const defaultMessage =
        `Expected the mock function to have returned with ${
          inspectArg(expected)
        }, but it did not`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  }
}

export function toHaveLastReturnedWith(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.result === "returned");
  const lastReturnedWithExpected = returned.length > 0 &&
    equal(returned.at(-1)?.returned, expected);

  if (context.isNot) {
    if (lastReturnedWithExpected) {
      const defaultMessage =
        `Expected the mock function to not have last returned with ${
          inspectArg(expected)
        }, but it did`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (!lastReturnedWithExpected) {
      const defaultMessage =
        `Expected the mock function to have last returned with ${
          inspectArg(expected)
        }, but it did not`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  }
}

export function toHaveNthReturnedWith(
  context: MatcherContext,
  nth: number,
  expected: unknown,
): MatchResult {
  if (nth < 1) {
    throw new Error(`nth(${nth}) must be greater than 0`);
  }

  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.result === "returned");
  const returnIndex = nth - 1;
  const maybeNthReturned = returned[returnIndex];
  const nthReturnedWithExpected = maybeNthReturned &&
    equal(maybeNthReturned.returned, expected);

  if (context.isNot) {
    if (nthReturnedWithExpected) {
      const defaultMessage =
        `Expected the mock function to not have n-th (n=${nth}) returned with ${
          inspectArg(expected)
        }, but it did`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  } else {
    if (!nthReturnedWithExpected) {
      const defaultMessage =
        `Expected the mock function to have n-th (n=${nth}) returned with ${
          inspectArg(expected)
        }, but it did not`;
      throw new AssertionError(
        context.customMessage
          ? `${context.customMessage}: ${defaultMessage}`
          : defaultMessage,
      );
    }
  }
}
