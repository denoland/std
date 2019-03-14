// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { createStr, buildDiffMessage, buildMessage } from "./pretty.ts";
import diff, { DiffResult } from "./diff.ts";

interface Constructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): any;
}

export class AssertionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AssertionError";
  }
}

export function equal(c: unknown, d: unknown): boolean {
  const seen = new Map();
  return (function compare(a: unknown, b: unknown) {
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (seen.get(a) === b) {
        return true;
      }
      if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
        return false;
      }
      const merged = { ...a, ...b };
      for (const key in merged) {
        type Key = keyof typeof merged;
        if (!compare(a && a[key as Key], b && b[key as Key])) {
          return false;
        }
      }
      seen.set(a, b);
      return true;
    }
    return false;
  })(c, d);
}

/** Make an assertion, if not `true`, then throw. */
export function assert(expr: boolean, msg = ""): void {
  if (!expr) {
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 */
export function assertEquals(
  actual: unknown,
  expected: unknown,
  msg?: string
): void {
  if (equal(actual, expected)) {
    return;
  }
  if (msg) {
    throw new AssertionError(msg);
  }
  let message = "";
  const actualString = createStr(actual);
  const expectedString = createStr(expected);
  try {
    const diffResult: ReadonlyArray<DiffResult<string>> = diff(
      actualString.split("\n"),
      expectedString.split("\n")
    );
    message = buildDiffMessage("assertEquals", diffResult).join("\n");
  } catch (e) {
    message = `\n${"[Cannot display]"} + \n\n`;
  }
  throw new AssertionError(message);
}

/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 */
export function assertNotEquals(
  actual: unknown,
  expected: unknown,
  msg?: string
): void {
  if (!equal(actual, expected)) {
    return;
  }
  if (msg) {
    throw new AssertionError(msg);
  }
  msg = buildMessage(
    "assertNotEquals",
    actual,
    expected,
    "Expected actual to be different than expected"
  ).join("\n");
  throw new AssertionError(msg);
}

/**
 * Make an assertion that `actual` and `expected` are strictly equal.  If
 * not then throw.
 */
export function assertStrictEq(
  actual: unknown,
  expected: unknown,
  msg?: string
): void {
  if (actual !== expected) {
    if (msg) {
      throw new AssertionError(msg);
    }
    msg = buildMessage(
      "assertStrictEq",
      actual,
      expected,
      "Actual must be strict equal === to Expected"
    ).join("\n");
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that actual contains expected. If not
 * then thrown.
 */
export function assertStrContains(
  actual: string,
  expected: string,
  msg?: string
): void {
  if (!actual.includes(expected)) {
    if (msg) {
      throw new AssertionError(msg);
    }
    msg = buildMessage(
      "assertStrContains",
      actual,
      expected,
      "Expected must contains Actual"
    ).join("\n");
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` contains the `expected` values
 * If not then thrown.
 */
export function assertArrayContains(
  actual: unknown[],
  expected: unknown[],
  msg?: string
): void {
  let missing = [];
  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (equal(expected[i], actual[j])) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(expected[i]);
    }
  }
  if (missing.length === 0) {
    return;
  }
  if (msg) {
    throw new AssertionError(msg);
  }
  let errorMsg = ["Actual Must contains expected values. "];
  errorMsg.push(`Missing value(s): ${missing}`);
  msg = buildMessage(
    "assertArrayContains",
    actual,
    expected,
    errorMsg.join("")
  ).join("\n");
  throw new AssertionError(msg);
}

/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then thrown
 */
export function assertMatch(
  actual: string,
  expected: RegExp,
  msg?: string
): void {
  if (!expected.test(actual)) {
    if (msg) {
      throw new AssertionError(msg);
    }
    msg = buildMessage(
      "assertMatch",
      actual,
      expected,
      "Actual has to match the Expected RegExp pattern"
    ).join("\n");
    throw new AssertionError(msg);
  }
}

/**
 * Forcefully throws a failed assertion
 */
export function fail(msg?: string): void {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}

/** Executes a function, expecting it to throw.  If it does not, then it
 * throws.  An error class and a string that should be included in the
 * error message can also be asserted.
 */
export function assertThrows(
  fn: () => void,
  ErrorClass?: Constructor,
  msgIncludes = "",
  msg?: string
): void {
  let doesThrow = false;
  try {
    fn();
  } catch (e) {
    if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
      msg = `Expected error to be instance of "${ErrorClass.name}"${
        msg ? `: ${msg}` : "."
      }`;
      throw new AssertionError(msg);
    }
    if (msgIncludes && !e.message.includes(msgIncludes)) {
      msg = `Expected error message to include "${msgIncludes}", but got "${
        e.message
      }"${msg ? `: ${msg}` : "."}`;
      throw new AssertionError(msg);
    }
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
    throw new AssertionError(msg);
  }
}

export async function assertThrowsAsync(
  fn: () => Promise<void>,
  ErrorClass?: Constructor,
  msgIncludes = "",
  msg?: string
): Promise<void> {
  let doesThrow = false;
  try {
    await fn();
  } catch (e) {
    if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
      msg = `Expected error to be instance of "${ErrorClass.name}"${
        msg ? `: ${msg}` : "."
      }`;
      throw new AssertionError(msg);
    }
    if (msgIncludes && !e.message.includes(msgIncludes)) {
      msg = `Expected error message to include "${msgIncludes}", but got "${
        e.message
      }"${msg ? `: ${msg}` : "."}`;
      throw new AssertionError(msg);
    }
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
    throw new AssertionError(msg);
  }
}

/** Use this to stub out methods that will throw when invoked. */
export function unimplemented(msg?: string): never {
  throw new AssertionError(msg || "unimplemented");
}

/** Use this to assert unreachable code. */
export function unreachable(): never {
  throw new AssertionError("unreachable");
}
