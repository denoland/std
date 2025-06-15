// Copyright 2018-2025 the Deno authors. MIT license.

import {
  assertEquals,
  assertObjectMatch,
  assertStrictEquals,
} from "@std/assert";
import { assertSpyCall, assertSpyCalls, type Spy, spy, stub } from "./mock.ts";
import { TestSuiteInternal } from "./_test_suite.ts";

class TestContext implements Deno.TestContext {
  name: string;
  origin: string;
  steps: TestContext[];
  spies: {
    step: Spy;
  };

  constructor(name: string) {
    this.name = name;
    this.origin = "origin";
    this.spies = {
      step: spy(this, "step"),
    };
    this.steps = [];
  }

  async step(t: Deno.TestStepDefinition): Promise<boolean>;
  async step(
    name: string,
    fn: (t: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean>;
  async step(
    fn: (t: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean>;
  async step(
    tOrNameOrFn:
      | Deno.TestStepDefinition
      | string
      | ((t: Deno.TestContext) => void | Promise<void>),
    fn?: (t: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean> {
    let ignore = false;
    if (typeof tOrNameOrFn === "function") {
      ignore = false;
      fn = tOrNameOrFn;
    } else if (typeof tOrNameOrFn === "object") {
      ignore = tOrNameOrFn.ignore ?? false;
      fn = tOrNameOrFn.fn;
    }

    const name = typeof tOrNameOrFn === "string"
      ? tOrNameOrFn
      : tOrNameOrFn.name;
    const context = new TestContext(name);
    this.steps.push(context);
    if (!ignore) {
      await fn!(context);
    }
    return !ignore;
  }
}

async function assertDescribeOptions<T>(
  expectedOptions: Omit<Deno.TestDefinition, "name" | "fn">,
  cb: (fn: Spy) => void,
) {
  using test = stub(Deno, "test");
  const fn = spy();
  try {
    cb(fn);

    assertSpyCalls(fn, 0);
    assertSpyCall(test, 0);
    const call = test.calls[0];
    const options = call?.args[0] as Deno.TestDefinition;
    assertEquals(
      Object.keys(options).sort(),
      ["name", "fn", ...Object.keys(expectedOptions)].sort(),
    );
    assertObjectMatch(options, {
      name: "example",
      ...expectedOptions,
    });

    const context = new TestContext("example");
    const result = options.fn(context);
    assertStrictEquals(Promise.resolve(result), result);
    assertEquals(await result, undefined);
    assertSpyCalls(context.spies.step, 0);
    assertSpyCall(fn, 0, {
      self: {},
      args: [context],
      returned: undefined,
    });
  } finally {
    TestSuiteInternal.reset();
  }
}

export async function assertMinimumDescribeOptions(
  cb: (fn: Spy) => void,
) {
  await assertDescribeOptions({}, cb);
}

async function assertItOptions(
  expectedOptions: Omit<Deno.TestDefinition, "name" | "fn">,
  cb: (fns: readonly [Spy, Spy]) => void,
) {
  using test = stub(Deno, "test");
  const fns = [spy(), spy()] as const;
  try {
    cb(fns);

    assertSpyCall(test, 0);
    const call = test.calls[0];
    const options = call?.args[0] as Deno.TestDefinition;
    assertEquals(
      Object.keys(options).sort(),
      ["name", "fn", ...Object.keys(expectedOptions)].sort(),
    );
    assertObjectMatch(options, {
      name: "example",
      ...expectedOptions,
    });

    assertSpyCalls(fns[0], 0);
    assertSpyCalls(fns[1], 0);

    const context = new TestContext("example");
    const result = options.fn(context);
    assertStrictEquals(Promise.resolve(result), result);
    assertEquals(await result, undefined);
    assertSpyCalls(context.spies.step, 2);

    let fn = fns[0];
    assertSpyCall(fn, 0, {
      self: {},
      args: [context.steps[0]],
      returned: undefined,
    });

    fn = fns[1];
    assertSpyCall(fn, 0, {
      self: {},
      args: [context.steps[1]],
      returned: undefined,
    });
    assertSpyCalls(fn, 1);
  } finally {
    TestSuiteInternal.reset();
  }
}

export async function assertMinimumItOptions(
  cb: (fns: readonly [Spy, Spy]) => void,
) {
  await assertItOptions({}, cb);
}
