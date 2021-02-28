// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file ban-types
import { AssertionError } from "./assertion_error.ts";
import * as asserts from "../testing/asserts.ts";
import { ERR_INVALID_ARG_TYPE } from "./_errors.ts";

/** Converts the std assertion error to node.js assertion error */
function toNode(
  fn: () => void,
  opts?: {
    actual: unknown;
    expected: unknown;
    message?: string | Error;
    operator?: string;
  },
) {
  const { operator, message, actual, expected } = opts || {};
  try {
    fn();
  } catch (e) {
    if (e instanceof asserts.AssertionError) {
      if (typeof message === "string") {
        throw new AssertionError({
          operator,
          message,
          actual,
          expected,
        });
      } else if (message instanceof Error) {
        throw message;
      } else {
        throw new AssertionError({
          operator,
          message: e.message,
          actual,
          expected,
        });
      }
    }
    throw e;
  }
}

function assert(actual: unknown, message?: string | Error): asserts actual {
  if (arguments.length === 0) {
    throw new AssertionError({
      message: "No value argument passed to `assert.ok()`",
    });
  }
  toNode(
    () => asserts.assert(actual),
    { message, actual, expected: true },
  );
}
const ok = assert;

function throws(
  fn: () => void,
  error?: RegExp | Function | Error,
  message?: string,
): void {
  // Check arg types
  if (typeof fn !== "function") {
    throw new ERR_INVALID_ARG_TYPE("fn", "function", fn);
  }
  if (typeof message === "string") {
    if (
      !(error instanceof RegExp) && typeof error !== "function" &&
      !(error instanceof Error) && typeof error !== "object"
    ) {
      throw new ERR_INVALID_ARG_TYPE("error", [
        "Function",
        "Error",
        "RegExp",
        "Object",
      ], error);
    }
  } else {
    if (
      typeof error !== "undefined" && typeof error !== "string" &&
      !(error instanceof RegExp) && typeof error !== "function" &&
      !(error instanceof Error) && typeof error !== "object"
    ) {
      throw new ERR_INVALID_ARG_TYPE("error", [
        "Function",
        "Error",
        "RegExp",
        "Object",
      ], error);
    }
  }

  // Checks test function
  try {
    fn();
  } catch (e) {
    if (!error) {
      return;
    }
    if (error instanceof Function && error.prototype !== undefined) {
      // error is a constructor
      if (e instanceof error) {
        return;
      }
      throw new AssertionError({
        message:
          `The error is expected to be an instance of "${error.name}". Received "${e
            ?.constructor?.name}"\n\nError message:\n\n${e.message}`,
        actual: e,
        expected: error,
        operator: "throws",
      });
    }
    if (error instanceof Function) {
      const received = error(e);
      if (received) {
        return;
      }
      throw new AssertionError({
        message:
          `The validation function is expected to return "true": received ${received}`,
        actual: e,
        expected: error,
        operator: "throws",
      });
    }
    if (error instanceof RegExp) {
      if (error.test(String(e))) {
        return;
      }
      throw new AssertionError({
        message:
          `The input did not match the regular expression ${error.toString()}. Input:\n\n'${
            String(e)
          }'\n`,
        actual: e,
        expected: error,
        operator: "throws",
      });
    }
    if (typeof error === "object" && error !== null) {
      const keys = Object.keys(error);
      if (error instanceof Error) {
        keys.push("name", "message");
      }
      for (const k of keys) {
        if (!(k in e)) {
          throw new AssertionError({
            message: message || `A key in the expected object is missing: ${k}`,
            actual: e,
            expected: error,
            operator: "throws",
          });
        }
        const actual = e[k];
        const expected = (error as any)[k];
        if (typeof actual === "string" && expected instanceof RegExp) {
          match(actual, expected);
        } else {
          deepStrictEqual(actual, expected);
        }
      }
      return;
    }
    throw new Error(`Invalid expectation: ${error}`);
  }
  let msg;
  if (message) {
    let msg = `Missing expected exception: ${message}`;
    if (typeof error === "function" && error?.name) {
      msg = `Missing expected exception (${error.name}): ${message}`;
    }
    throw new AssertionError({
      message: msg,
      operator: "throws",
      actual: undefined,
      expected: error,
    });
  } else if (typeof error === "string") {
    // Use case of throws(fn, message)
    throw new AssertionError({
      message: `Missing expected exception: ${error}`,
      operator: "throws",
      actual: undefined,
      expected: undefined,
    });
  } else if (typeof error === "function" && error?.prototype !== undefined) {
    throw new AssertionError({
      message: `Missing expected exception (${error.name}).`,
      operator: "throws",
      actual: undefined,
      expected: error,
    });
  } else {
    throw new AssertionError({
      message: "Missing expected exception.",
      operator: "throws",
      actual: undefined,
      expected: error,
    });
  }
}

function doesNotThrow(
  fn: () => void,
  message?: string,
): void;
function doesNotThrow(
  fn: () => void,
  error?: Function,
  message?: string | Error,
): void;
function doesNotThrow(
  fn: () => void,
  error?: RegExp,
  message?: string,
): void;
function doesNotThrow(
  fn: () => void,
  expected?: Function | RegExp | string,
  message?: string | Error,
): void {
  // Check arg type
  if (typeof fn !== "function") {
    throw new ERR_INVALID_ARG_TYPE("fn", "function", fn);
  } else if (
    !(expected instanceof RegExp) && typeof expected !== "function" &&
    typeof expected !== "string" && typeof expected !== "undefined"
  ) {
    throw new ERR_INVALID_ARG_TYPE("expected", ["Function", "RegExp"], fn);
  }

  // Checks test function
  if (typeof expected === "string") {
    // The use case of doesNotThrow(fn, message);
    try {
      fn();
    } catch (e) {
      throw new AssertionError({
        message:
          `Got unwanted exception: ${expected}\nActual message: "${e.message}"`,
        operator: "doesNotThrow",
      });
    }
    return;
  } else if (
    typeof expected === "function" && expected.prototype !== undefined
  ) {
    // The use case of doesNotThrow(fn, Error, message);
    try {
      fn();
    } catch (e) {
      if (e instanceof expected) {
        let msg = `Got unwanted exception: ${e.constructor?.name}`;
        if (message) {
          msg += ` ${String(message)}`;
        }
        throw new AssertionError({
          message: msg,
          operator: "doesNotThrow",
        });
      }
      throw e;
    }
    return;
  } else {
    try {
      fn();
    } catch (e) {
      if (message) {
        throw new AssertionError({
          message: `Got unwanted exception: ${message}\nActual message: "${
            e ? e.message : String(e)
          }"`,
          operator: "doesNotThrow",
        });
      }
      throw new AssertionError({
        message: `Got unwanted exception.\nActual message: "${
          e ? e.message : String(e)
        }"`,
        operator: "doesNotThrow",
      });
    }
    return;
  }
}

function equal(
  actual: unknown,
  expected: unknown,
  message?: string | Error,
): void {
  if (actual == expected) {
    return;
  }

  if (Number.isNaN(actual) && Number.isNaN(expected)) {
    return;
  }

  if (typeof message === "string") {
    throw new AssertionError({
      message,
    });
  } else if (message instanceof Error) {
    throw message;
  }

  toNode(
    () => asserts.assertStrictEquals(actual, expected),
    {
      message: message || `${actual} == ${expected}`,
      operator: "==",
      actual,
      expected,
    },
  );
}
function notEqual(
  actual: unknown,
  expected: unknown,
  message?: string | Error,
): void {
  if (Number.isNaN(actual) && Number.isNaN(expected)) {
    throw new AssertionError({
      message: `${actual} != ${expected}`,
      operator: "!=",
      actual,
      expected,
    });
  }
  if (actual != expected) {
    return;
  }

  if (typeof message === "string") {
    throw new AssertionError({
      message,
    });
  } else if (message instanceof Error) {
    throw message;
  }

  toNode(
    () => asserts.assertNotStrictEquals(actual, expected),
    {
      message: message || `${actual} != ${expected}`,
      operator: "!=",
      actual,
      expected,
    },
  );
}
function strictEqual(
  actual: unknown,
  expected: unknown,
  message?: string | Error,
): void {
  toNode(
    () => asserts.assertStrictEquals(actual, expected),
    { message, operator: "===", actual, expected },
  );
}
function notStrictEqual(
  actual: unknown,
  expected: unknown,
  message?: string | Error,
) {
  toNode(
    () => asserts.assertNotStrictEquals(actual, expected),
    { message, operator: "!==", actual, expected },
  );
}
function deepEqual() {}
function notDeepEqual() {}
function deepStrictEqual(
  actual: unknown,
  expected: unknown,
  message?: string | Error,
) {
  toNode(
    () => asserts.assertEquals(actual, expected),
    { message, actual, expected },
  );
}
function notDeepStrictEqual(
  actual: unknown,
  expected: unknown,
  message?: string | Error,
) {
  toNode(
    () => asserts.assertNotEquals(actual, expected),
    { message, actual, expected },
  );
}

function fail() {
  toNode(() => fail());
}
function match(actual: string, expected: RegExp, message?: string | Error) {
  toNode(
    () => asserts.assertMatch(actual, expected),
    { message, actual, expected },
  );
}

function strict(actual: unknown, message?: string | Error): asserts actual {
  if (arguments.length === 0) {
    throw new AssertionError({
      message: "No value argument passed to `assert.ok()`",
    });
  }
  assert(actual, message);
}

Object.assign(strict, {
  AssertionError,
  deepEqual: deepStrictEqual,
  deepStrictEqual,
  doesNotThrow,
  equal: strictEqual,
  fail,
  match,
  notDeepEqual: notDeepStrictEqual,
  notDeepStrictEqual,
  notEqual: notStrictEqual,
  notStrictEqual,
  ok,
  strict,
  strictEqual,
  throws,
});

export default Object.assign(assert, {
  AssertionError,
  deepEqual,
  deepStrictEqual,
  doesNotThrow,
  equal,
  fail,
  match,
  notDeepEqual,
  notDeepStrictEqual,
  notEqual,
  notStrictEqual,
  ok,
  strict,
  strictEqual,
  throws,
});

export {
  AssertionError,
  deepEqual,
  deepStrictEqual,
  doesNotThrow,
  equal,
  fail,
  match,
  notDeepEqual,
  notDeepStrictEqual,
  notEqual,
  notStrictEqual,
  ok,
  strict,
  strictEqual,
  throws,
};
