// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// Do not add imports in this file in order to be compatible with Node.

export function assertEqual(actual: unknown, expected: unknown, msg?: string) {
  if (!equal(actual, expected)) {
    let actualString: string;
    let expectedString: string;
    try {
      actualString = String(actual);
    } catch (e) {
      actualString = "[Cannot display]";
    }
    try {
      expectedString = String(expected);
    } catch (e) {
      expectedString = "[Cannot display]";
    }
    console.error(
      "assertEqual failed. actual =",
      actualString,
      "expected =",
      expectedString
    );
    if (!msg) {
      msg = `actual: ${actualString} expected: ${expectedString}`;
    }
    throw new Error(msg);
  }
}

export function assert(expr: boolean, msg = "") {
  if (!expr) {
    throw new Error(msg);
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

export type TestFunction = () => void | Promise<void>;

export interface TestDefinition {
  fn: TestFunction;
  name: string;
}

export const exitOnFail = true;

let filterRegExp: RegExp | null;
const tests: TestDefinition[] = [];
const setUps: TestFunction[] = [];
const tearDowns: TestFunction[] = [];

let filtered = 0;
const ignored = 0;
const measured = 0;

export function setUp(t: TestFunction): void {
  setUps.push(t);
}
export function tearDown(t: TestFunction): void {
  tearDowns.push(t);
}

// Must be called before any test() that needs to be filtered.
export function setFilter(s: string): void {
  filterRegExp = new RegExp(s, "i");
}

export function test(t: TestDefinition | TestFunction): void {
  const fn: TestFunction = typeof t === "function" ? t : t.fn;
  const name: string = t.name;

  if (!name) {
    throw new Error("Test function may not be anonymous");
  }
  if (filter(name)) {
    tests.push({ fn, name });
  } else {
    filtered++;
  }
}

function filter(name: string): boolean {
  if (filterRegExp) {
    return filterRegExp.test(name);
  } else {
    return true;
  }
}

const RESET = "\x1b[0m";
const FG_RED = "\x1b[31m";
const FG_GREEN = "\x1b[32m";

function red_failed() {
  return FG_RED + "FAILED" + RESET;
}

function green_ok() {
  return FG_GREEN + "ok" + RESET;
}

export async function runTests() {
  let passed = 0;
  let failed = 0;

  for (let s of setUps) {
    await s();
  }
  console.log("running", tests.length, "tests");
  for (let t of tests) {
    const { fn, name } = t;
    let result = green_ok();
    // See https://github.com/denoland/deno/pull/1452
    // about this usage of groupCollapsed
    console.groupCollapsed(`test ${name} `);
    try {
      await fn();
      passed++;
      console.log("...", result);
      console.groupEnd();
    } catch (e) {
      result = red_failed();
      console.log("...", result);
      console.groupEnd();
      console.error((e && e.stack) || e);
      failed++;
      if (exitOnFail) {
        break;
      }
    }
  }
  for (let t of tearDowns) {
    await t();
  }

  // Attempting to match the output of Rust's test runner.
  const result = failed > 0 ? red_failed() : green_ok();
  console.log(
    `\ntest result: ${result}. ${passed} passed; ${failed} failed; ` +
      `${ignored} ignored; ${measured} measured; ${filtered} filtered out\n`
  );

  if (failed === 0) {
    // All good.
  } else {
    // Use setTimeout to avoid the error being ignored due to unhandled
    // promise rejections being swallowed.
    setTimeout(() => {
      throw new Error(`There were ${failed} test failures.`);
    }, 0);
  }
}

const t = setTimeout(runTests, 0);
export function cancelTests() {
  clearTimeout(t);
}
