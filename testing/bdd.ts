// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/** A [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) interface
 * to `Deno.test()` API.
 *
 * @module
 */

import {
  DescribeDefinition,
  HookNames,
  ItDefinition,
  TestSuite,
  TestSuiteInternal,
} from "./_test_suite.ts";
export type { DescribeDefinition, ItDefinition, TestSuite };

/** The arguments for an ItFunction. */
export type ItArgs<T> =
  | [options: ItDefinition<T>]
  | [
    name: string,
    options: Omit<ItDefinition<T>, "name">,
  ]
  | [
    name: string,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [fn: (this: T, t: Deno.TestContext) => void | Promise<void>]
  | [
    name: string,
    options: Omit<ItDefinition<T>, "fn" | "name">,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    options: Omit<ItDefinition<T>, "fn">,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    options: Omit<ItDefinition<T>, "fn" | "name">,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<ItDefinition<T>, "name" | "suite">,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<ItDefinition<T>, "fn" | "name" | "suite">,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<ItDefinition<T>, "fn" | "suite">,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<ItDefinition<T>, "fn" | "name" | "suite">,
    fn: (this: T, t: Deno.TestContext) => void | Promise<void>,
  ];

/** Generates an ItDefinition from ItArgs. */
function itDefinition<T>(...args: ItArgs<T>): ItDefinition<T> {
  let [
    suiteOptionsOrNameOrFn,
    optionsOrNameOrFn,
    optionsOrFn,
    fn,
  ] = args;
  let suite: TestSuite<T> | undefined = undefined;
  let name: string;
  let options:
    | ItDefinition<T>
    | Omit<ItDefinition<T>, "fn">
    | Omit<ItDefinition<T>, "name">
    | Omit<ItDefinition<T>, "fn" | "name">;
  if (
    typeof suiteOptionsOrNameOrFn === "object" &&
    typeof (suiteOptionsOrNameOrFn as TestSuite<T>).symbol === "symbol"
  ) {
    suite = suiteOptionsOrNameOrFn as TestSuite<T>;
  } else {
    fn = optionsOrFn as typeof fn;
    optionsOrFn = optionsOrNameOrFn as typeof optionsOrFn;
    optionsOrNameOrFn = suiteOptionsOrNameOrFn as typeof optionsOrNameOrFn;
  }
  if (typeof optionsOrNameOrFn === "string") {
    name = optionsOrNameOrFn;
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
      options = {};
    } else {
      options = optionsOrFn!;
      if (!fn) fn = (options as Omit<ItDefinition<T>, "name">).fn;
    }
  } else if (typeof optionsOrNameOrFn === "function") {
    fn = optionsOrNameOrFn;
    name = fn.name;
    options = {};
  } else {
    options = optionsOrNameOrFn!;
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
    } else {
      fn = (options as ItDefinition<T>).fn;
    }
    name = (options as ItDefinition<T>).name ?? fn.name;
  }

  return {
    suite,
    ...options,
    name,
    fn,
  };
}

/** Registers an individual test case. */
export interface it {
  <T>(...args: ItArgs<T>): void;

  /** Registers an individual test case with only set to true. */
  only<T>(...args: ItArgs<T>): void;

  /** Registers an individual test case with ignore set to true. */
  ignore<T>(...args: ItArgs<T>): void;
}

/** Registers an individual test case. */
export function it<T>(...args: ItArgs<T>) {
  if (TestSuiteInternal.runningCount > 0) {
    throw new Error(
      "cannot register new test cases after already registered test cases start running",
    );
  }
  const options = itDefinition(...args);
  const { suite } = options;
  const testSuite = suite
    ? TestSuiteInternal.suites.get(suite.symbol)
    : TestSuiteInternal.current;

  if (!TestSuiteInternal.started) TestSuiteInternal.started = true;
  if (testSuite) {
    TestSuiteInternal.addStep(testSuite, options);
  } else {
    const {
      name,
      fn,
      ignore,
      only,
      permissions,
      sanitizeExit,
      sanitizeOps,
      sanitizeResources,
    } = options;
    TestSuiteInternal.registerTest({
      name,
      ignore,
      only,
      permissions,
      sanitizeExit,
      sanitizeOps,
      sanitizeResources,
      async fn(t) {
        TestSuiteInternal.runningCount++;
        try {
          await fn.call({} as T, t);
        } finally {
          TestSuiteInternal.runningCount--;
        }
      },
    });
  }
}

it.only = function itOnly<T>(...args: ItArgs<T>) {
  const options = itDefinition(...args);
  return it({
    ...options,
    only: true,
  });
};

it.ignore = function itIgnore<T>(...args: ItArgs<T>) {
  const options = itDefinition(...args);
  return it({
    ...options,
    ignore: true,
  });
};

function addHook<T>(
  name: HookNames,
  fn: (this: T) => void | Promise<void>,
) {
  if (!TestSuiteInternal.current) {
    if (TestSuiteInternal.started) {
      throw new Error(
        "cannot add global hooks after a global test is registered",
      );
    }
    TestSuiteInternal.current = new TestSuiteInternal({
      name: "global",
      [name]: fn,
    });
  } else {
    TestSuiteInternal.setHook(TestSuiteInternal.current!, name, fn);
  }
}

/** Run some shared setup before all of the tests in the suite. */
export function beforeAll<T>(
  fn: (this: T) => void | Promise<void>,
) {
  addHook("beforeAll", fn);
}

/** Run some shared teardown after all of the tests in the suite. */
export function afterAll<T>(
  fn: (this: T) => void | Promise<void>,
) {
  addHook("afterAll", fn);
}

/** Run some shared setup before each test in the suite. */
export function beforeEach<T>(
  fn: (this: T) => void | Promise<void>,
) {
  addHook("beforeEach", fn);
}

/** Run some shared teardown after each test in the suite. */
export function afterEach<T>(
  fn: (this: T) => void | Promise<void>,
) {
  addHook("afterEach", fn);
}

/** The arguments for a DescribeFunction. */
export type DescribeArgs<T> =
  | [options: DescribeDefinition<T>]
  | [name: string]
  | [
    name: string,
    options: Omit<DescribeDefinition<T>, "name">,
  ]
  | [name: string, fn: () => void]
  | [fn: () => void]
  | [
    name: string,
    options: Omit<DescribeDefinition<T>, "fn" | "name">,
    fn: () => void,
  ]
  | [
    options: Omit<DescribeDefinition<T>, "fn">,
    fn: () => void,
  ]
  | [
    options: Omit<DescribeDefinition<T>, "fn" | "name">,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<DescribeDefinition<T>, "name" | "suite">,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<DescribeDefinition<T>, "fn" | "name" | "suite">,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<DescribeDefinition<T>, "fn" | "suite">,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<DescribeDefinition<T>, "fn" | "name" | "suite">,
    fn: () => void,
  ];

/** Generates a DescribeDefinition from DescribeArgs. */
function describeDefinition<T>(
  ...args: DescribeArgs<T>
): DescribeDefinition<T> {
  let [
    suiteOptionsOrNameOrFn,
    optionsOrNameOrFn,
    optionsOrFn,
    fn,
  ] = args;
  let suite: TestSuite<T> | undefined = undefined;
  let name: string;
  let options:
    | DescribeDefinition<T>
    | Omit<DescribeDefinition<T>, "fn">
    | Omit<DescribeDefinition<T>, "name">
    | Omit<DescribeDefinition<T>, "fn" | "name">;
  if (
    typeof suiteOptionsOrNameOrFn === "object" &&
    typeof (suiteOptionsOrNameOrFn as TestSuite<T>).symbol === "symbol"
  ) {
    suite = suiteOptionsOrNameOrFn as TestSuite<T>;
  } else {
    fn = optionsOrFn as typeof fn;
    optionsOrFn = optionsOrNameOrFn as typeof optionsOrFn;
    optionsOrNameOrFn = suiteOptionsOrNameOrFn as typeof optionsOrNameOrFn;
  }
  if (typeof optionsOrNameOrFn === "string") {
    name = optionsOrNameOrFn;
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
      options = {};
    } else {
      options = optionsOrFn ?? {};
      if (!fn) fn = (options as Omit<DescribeDefinition<T>, "name">).fn;
    }
  } else if (typeof optionsOrNameOrFn === "function") {
    fn = optionsOrNameOrFn;
    name = fn.name;
    options = {};
  } else {
    options = optionsOrNameOrFn ?? {};
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
    } else {
      fn = (options as DescribeDefinition<T>).fn;
    }
    name = (options as DescribeDefinition<T>).name ?? fn?.name ?? "";
  }

  if (!suite) {
    suite = options.suite;
  }
  if (!suite && TestSuiteInternal.current) {
    const { symbol } = TestSuiteInternal.current;
    suite = { symbol };
  }

  return {
    ...options,
    suite,
    name,
    fn,
  };
}

/** Registers a test suite. */
export interface describe {
  <T>(...args: DescribeArgs<T>): TestSuite<T>;

  /** Registers a test suite with only set to true. */
  only<T>(...args: DescribeArgs<T>): TestSuite<T>;

  /** Registers a test suite with ignore set to true. */
  ignore<T>(...args: DescribeArgs<T>): TestSuite<T>;
}

/** Registers a test suite. */
export function describe<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  if (TestSuiteInternal.runningCount > 0) {
    throw new Error(
      "cannot register new test suites after already registered test cases start running",
    );
  }
  const options = describeDefinition(...args);
  if (!TestSuiteInternal.started) TestSuiteInternal.started = true;
  const { symbol } = new TestSuiteInternal(options);
  return { symbol };
}

describe.only = function describeOnly<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return describe({
    ...options,
    only: true,
  });
};

describe.ignore = function describeIgnore<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return describe({
    ...options,
    ignore: true,
  });
};
