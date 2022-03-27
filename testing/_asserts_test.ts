import { AssertionError, assertRejects, assertThrows } from "./asserts.ts";
import {
  assertSpyCall,
  assertSpyCallArg,
  assertSpyCallArgs,
  assertSpyCallAsync,
  assertSpyCalls,
} from "./_asserts.ts";
import { Point } from "./_test_utils.ts";
import { spy, stub } from "./mock.ts";

Deno.test("assertSpyCalls", () => {
  const spyFunc = spy();

  assertSpyCalls(spyFunc, 0);
  assertThrows(
    () => assertSpyCalls(spyFunc, 1),
    AssertionError,
    "spy not called as much as expected",
  );

  spyFunc();
  assertSpyCalls(spyFunc, 1);
  assertThrows(
    () => assertSpyCalls(spyFunc, 0),
    AssertionError,
    "spy called more than expected",
  );
  assertThrows(
    () => assertSpyCalls(spyFunc, 2),
    AssertionError,
    "spy not called as much as expected",
  );
});

Deno.test("assertSpyCall function", () => {
  const spyFunc = spy((multiplier?: number) => 5 * (multiplier ?? 1));

  assertThrows(
    () => assertSpyCall(spyFunc, 0),
    AssertionError,
    "spy not called as much as expected",
  );

  spyFunc();
  assertSpyCall(spyFunc, 0);
  assertSpyCall(spyFunc, 0, {
    args: [],
    self: undefined,
    returned: 5,
  });
  assertSpyCall(spyFunc, 0, {
    args: [],
  });
  assertSpyCall(spyFunc, 0, {
    self: undefined,
  });
  assertSpyCall(spyFunc, 0, {
    returned: 5,
  });

  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        args: [1],
        self: {},
        returned: 2,
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "spy not called as method on expected self",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        returned: 2,
      }),
    AssertionError,
    "spy call did not return expected value",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: { msgIncludes: "x" },
      }),
    AssertionError,
    "spy call did not throw an error, a value was returned.",
  );
  assertThrows(
    () => assertSpyCall(spyFunc, 1),
    AssertionError,
    "spy not called as much as expected",
  );
});

Deno.test("assertSpyCall method", () => {
  const point = new Point(2, 3);
  const spyMethod = spy(point, "action");

  assertThrows(
    () => assertSpyCall(spyMethod, 0),
    AssertionError,
    "spy not called as much as expected",
  );

  point.action(3, 7);
  assertSpyCall(spyMethod, 0);
  assertSpyCall(spyMethod, 0, {
    args: [3, 7],
    self: point,
    returned: 3,
  });
  assertSpyCall(spyMethod, 0, {
    args: [3, 7],
  });
  assertSpyCall(spyMethod, 0, {
    self: point,
  });
  assertSpyCall(spyMethod, 0, {
    returned: 3,
  });

  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        args: [7, 4],
        self: undefined,
        returned: 7,
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        args: [7, 3],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        self: undefined,
      }),
    AssertionError,
    "spy not expected to be called as method on object",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        returned: 7,
      }),
    AssertionError,
    "spy call did not return expected value",
  );
  assertThrows(
    () => assertSpyCall(spyMethod, 1),
    AssertionError,
    "spy not called as much as expected",
  );

  spyMethod.call(point, 9);
  assertSpyCall(spyMethod, 1);
  assertSpyCall(spyMethod, 1, {
    args: [9],
    self: point,
    returned: 9,
  });
  assertSpyCall(spyMethod, 1, {
    args: [9],
  });
  assertSpyCall(spyMethod, 1, {
    self: point,
  });
  assertSpyCall(spyMethod, 1, {
    returned: 9,
  });

  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        args: [7, 4],
        self: point,
        returned: 7,
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        args: [7, 3],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        self: new Point(1, 2),
      }),
    AssertionError,
    "spy not called as method on expected self",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        returned: 7,
      }),
    AssertionError,
    "spy call did not return expected value",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        error: { msgIncludes: "x" },
      }),
    AssertionError,
    "spy call did not throw an error, a value was returned.",
  );
  assertThrows(
    () => assertSpyCall(spyMethod, 2),
    AssertionError,
    "spy not called as much as expected",
  );
});

class ExampleError extends Error {}
class OtherError extends Error {}

Deno.test("assertSpyCall error", () => {
  const spyFunc = spy((_value?: number) => {
    throw new ExampleError("failed");
  });

  assertThrows(() => spyFunc(), ExampleError, "fail");
  assertSpyCall(spyFunc, 0);
  assertSpyCall(spyFunc, 0, {
    args: [],
    self: undefined,
    error: {
      Class: ExampleError,
      msgIncludes: "fail",
    },
  });
  assertSpyCall(spyFunc, 0, {
    args: [],
  });
  assertSpyCall(spyFunc, 0, {
    self: undefined,
  });
  assertSpyCall(spyFunc, 0, {
    error: {
      Class: ExampleError,
      msgIncludes: "fail",
    },
  });
  assertSpyCall(spyFunc, 0, {
    error: {
      Class: Error,
      msgIncludes: "fail",
    },
  });

  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        args: [1],
        self: {},
        error: {
          Class: OtherError,
          msgIncludes: "fail",
        },
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "spy not called as method on expected self",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: {
          Class: OtherError,
          msgIncludes: "fail",
        },
      }),
    AssertionError,
    'Expected error to be instance of "OtherError", but was "ExampleError".',
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: {
          Class: OtherError,
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error to be instance of "OtherError", but was "ExampleError".',
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: {
          Class: ExampleError,
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error message to include "x", but got "failed".',
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: {
          Class: Error,
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error message to include "x", but got "failed".',
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: {
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error message to include "x", but got "failed".',
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        returned: 7,
      }),
    AssertionError,
    "spy call did not return expected value, an error was thrown.",
  );
  assertThrows(
    () => assertSpyCall(spyFunc, 1),
    AssertionError,
    "spy not called as much as expected",
  );
});

Deno.test("assertSpyCallAsync function", async () => {
  const spyFunc = spy((multiplier?: number) =>
    Promise.resolve(5 * (multiplier ?? 1))
  );

  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 0),
    AssertionError,
    "spy not called as much as expected",
  );

  await spyFunc();
  await assertSpyCallAsync(spyFunc, 0);
  await assertSpyCallAsync(spyFunc, 0, {
    args: [],
    self: undefined,
    returned: 5,
  });
  await assertSpyCallAsync(spyFunc, 0, {
    args: [],
    self: undefined,
    returned: Promise.resolve(5),
  });
  await assertSpyCallAsync(spyFunc, 0, {
    args: [],
  });
  await assertSpyCallAsync(spyFunc, 0, {
    self: undefined,
  });
  await assertSpyCallAsync(spyFunc, 0, {
    returned: Promise.resolve(5),
  });

  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        args: [1],
        self: {},
        returned: 2,
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "spy not called as method on expected self",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: 2,
      }),
    AssertionError,
    "spy call did not resolve to expected value",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: Promise.resolve(2),
      }),
    AssertionError,
    "spy call did not resolve to expected value",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 1),
    AssertionError,
    "spy not called as much as expected",
  );
});

Deno.test("assertSpyCallAsync method", async () => {
  const point: Point = new Point(2, 3);
  const spyMethod = stub(
    point,
    "action",
    (x?: number, _y?: number) => Promise.resolve(x),
  );

  await assertRejects(
    () => assertSpyCallAsync(spyMethod, 0),
    AssertionError,
    "spy not called as much as expected",
  );

  await point.action(3, 7);
  await assertSpyCallAsync(spyMethod, 0);
  await assertSpyCallAsync(spyMethod, 0, {
    args: [3, 7],
    self: point,
    returned: 3,
  });
  await assertSpyCallAsync(spyMethod, 0, {
    args: [3, 7],
    self: point,
    returned: Promise.resolve(3),
  });
  await assertSpyCallAsync(spyMethod, 0, {
    args: [3, 7],
  });
  await assertSpyCallAsync(spyMethod, 0, {
    self: point,
  });
  await assertSpyCallAsync(spyMethod, 0, {
    returned: 3,
  });
  await assertSpyCallAsync(spyMethod, 0, {
    returned: Promise.resolve(3),
  });

  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        args: [7, 4],
        self: undefined,
        returned: 7,
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        args: [7, 3],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        self: undefined,
      }),
    AssertionError,
    "spy not expected to be called as method on object",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        returned: 7,
      }),
    AssertionError,
    "spy call did not resolve to expected value",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        returned: Promise.resolve(7),
      }),
    AssertionError,
    "spy call did not resolve to expected value",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyMethod, 1),
    AssertionError,
    "spy not called as much as expected",
  );

  await spyMethod.call(point, 9);
  await assertSpyCallAsync(spyMethod, 1);
  await assertSpyCallAsync(spyMethod, 1, {
    args: [9],
    self: point,
    returned: 9,
  });
  await assertSpyCallAsync(spyMethod, 1, {
    args: [9],
    self: point,
    returned: Promise.resolve(9),
  });
  await assertSpyCallAsync(spyMethod, 1, {
    args: [9],
  });
  await assertSpyCallAsync(spyMethod, 1, {
    self: point,
  });
  await assertSpyCallAsync(spyMethod, 1, {
    returned: 9,
  });
  await assertSpyCallAsync(spyMethod, 1, {
    returned: Promise.resolve(9),
  });

  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        args: [7, 4],
        self: point,
        returned: 7,
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        args: [7, 3],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        self: new Point(1, 2),
      }),
    AssertionError,
    "spy not called as method on expected self",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        returned: 7,
      }),
    AssertionError,
    "spy call did not resolve to expected value",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        returned: Promise.resolve(7),
      }),
    AssertionError,
    "spy call did not resolve to expected value",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyMethod, 2),
    AssertionError,
    "spy not called as much as expected",
  );
});

Deno.test("assertSpyCallAync on sync value", async () => {
  const spyFunc = spy(() => 4 as unknown as Promise<number>);

  spyFunc();
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 0),
    AssertionError,
    "spy call did not return a promise, a value was returned.",
  );
});

Deno.test("assertSpyCallAync on sync error", async () => {
  const spyFunc = spy(() => {
    throw new ExampleError("failed");
  });

  await assertRejects(() => spyFunc(), ExampleError, "fail");
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 0),
    AssertionError,
    "spy call did not return a promise, an error was thrown.",
  );
});

Deno.test("assertSpyCallAync error", async () => {
  const spyFunc = spy((..._args: number[]): Promise<number> =>
    Promise.reject(new ExampleError("failed"))
  );

  await assertRejects(() => spyFunc(), ExampleError, "fail");
  await assertSpyCallAsync(spyFunc, 0);
  await assertSpyCallAsync(spyFunc, 0, {
    args: [],
    self: undefined,
    error: {
      Class: ExampleError,
      msgIncludes: "fail",
    },
  });
  await assertSpyCallAsync(spyFunc, 0, {
    args: [],
  });
  await assertSpyCallAsync(spyFunc, 0, {
    self: undefined,
  });
  await assertSpyCallAsync(spyFunc, 0, {
    error: {
      Class: ExampleError,
      msgIncludes: "fail",
    },
  });
  await assertSpyCallAsync(spyFunc, 0, {
    error: {
      Class: Error,
      msgIncludes: "fail",
    },
  });

  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        args: [1],
        self: {},
        error: {
          Class: OtherError,
          msgIncludes: "fail",
        },
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "spy not called as method on expected self",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        error: {
          Class: OtherError,
          msgIncludes: "fail",
        },
      }),
    AssertionError,
    'Expected error to be instance of "OtherError"',
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        error: {
          Class: OtherError,
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error to be instance of "OtherError"',
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        error: {
          Class: ExampleError,
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error message to include "x", but got "failed".',
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        error: {
          Class: Error,
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error message to include "x", but got "failed".',
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        error: {
          msgIncludes: "x",
        },
      }),
    AssertionError,
    'Expected error message to include "x", but got "failed".',
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: Promise.resolve(7),
      }),
    AssertionError,
    "spy call returned promise was rejected",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: Promise.resolve(7),
        error: { msgIncludes: "x" },
      }),
    TypeError,
    "do not expect error and return, only one should be expected",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 1),
    AssertionError,
    "spy not called as much as expected",
  );
});

Deno.test("assertSpyArg", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 0, undefined),
    AssertionError,
    "spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArg(spyFunc, 0, 0, undefined);
  assertSpyCallArg(spyFunc, 0, 1, undefined);
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 0, 2),
    AssertionError,
    "Values are not equal:",
  );

  spyFunc(7, 9);
  assertSpyCallArg(spyFunc, 1, 0, 7);
  assertSpyCallArg(spyFunc, 1, 1, 9);
  assertSpyCallArg(spyFunc, 1, 2, undefined);
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 0, 9),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 1, 7),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 2, 7),
    AssertionError,
    "Values are not equal:",
  );
});

Deno.test("assertSpyArgs without range", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, []),
    AssertionError,
    "spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArgs(spyFunc, 0, []);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, [undefined]),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, [2]),
    AssertionError,
    "Values are not equal:",
  );

  spyFunc(7, 9);
  assertSpyCallArgs(spyFunc, 1, [7, 9]);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, [7, 9, undefined]),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, [9, 7]),
    AssertionError,
    "Values are not equal:",
  );
});

Deno.test("assertSpyArgs with start only", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, []),
    AssertionError,
    "spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArgs(spyFunc, 0, 1, []);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, [undefined]),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, [2]),
    AssertionError,
    "Values are not equal:",
  );

  spyFunc(7, 9, 8);
  assertSpyCallArgs(spyFunc, 1, 1, [9, 8]);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, [9, 8, undefined]),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, [9, 7]),
    AssertionError,
    "Values are not equal:",
  );
});

Deno.test("assertSpyArgs with range", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, 3, []),
    AssertionError,
    "spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArgs(spyFunc, 0, 1, 3, []);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, 3, [undefined, undefined]),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, 3, [2, 4]),
    AssertionError,
    "Values are not equal:",
  );

  spyFunc(7, 9, 8, 5, 6);
  assertSpyCallArgs(spyFunc, 1, 1, 3, [9, 8]);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, 3, [9, 8, undefined]),
    AssertionError,
    "Values are not equal:",
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, 3, [9, 7]),
    AssertionError,
    "Values are not equal:",
  );
});
