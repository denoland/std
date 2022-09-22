# Testing

This module provides a few basic utilities to make testing easier and consistent
in Deno.

## Usage

`testing/asserts.ts` module provides range of assertion helpers. If the
assertion is false an `AssertionError` will be thrown which will result in
pretty-printed diff of failing assertion.

- `equal()` - Deep comparison function, where `actual` and `expected` are
  compared deeply, and if they vary, `equal` returns `false`.
- `assert()` - Expects a boolean value, throws if the value is `false`.
- `assertFalse()` - Expects a boolean value, throws if the value is `true`.
- `assertEquals()` - Uses the `equal` comparison and throws if the `actual` and
  `expected` are not equal.
- `assertNotEquals()` - Uses the `equal` comparison and throws if the `actual`
  and `expected` are equal.
- `assertStrictEquals()` - Compares `actual` and `expected` strictly, therefore
  for non-primitives the values must reference the same instance.
- `assertAlmostEquals()` - Make an assertion that `actual` is almost equal to
  `expected`, according to a given `epsilon` _(defaults to `1e-7`)_
- `assertInstanceOf()` - Make an assertion that `actual` is an instance of
  `expectedType`.
- `assertNotInstanceOf()` - Make an assertion that `actual` is not an instance
  of `expectedType`.
- `assertStringIncludes()` - Make an assertion that `actual` includes
  `expected`.
- `assertMatch()` - Make an assertion that `actual` match RegExp `expected`.
- `assertNotMatch()` - Make an assertion that `actual` not match RegExp
  `expected`.
- `assertArrayIncludes()` - Make an assertion that `actual` array includes the
  `expected` values.
- `assertObjectMatch()` - Make an assertion that `actual` object match
  `expected` subset object
- `assertSnapshot()` - Make an assertion that `actual` matches a snapshot
- `assertThrows()` - Expects the passed `fn` to throw. If `fn` does not throw,
  this function does. Also compares any errors thrown to an optional expected
  `Error` class and checks that the error `.message` includes an optional
  string. If there is caught error, it gets returned.
- `assertRejects()` - Expects the passed `fn` to be async and return a
  `PromiseLike` object that rejects. If the `fn` does not reject, this function
  will reject _(⚠️ you should normally await this assertion)_. Also optionally
  accepts an Error class which the expected error must be an instance of, and a
  string which must be a substring of the error's `.message`. If there is caught
  error, it gets returned.
- `unimplemented()` - Use this to stub out methods that will throw when invoked.
- `unreachable()` - Used to assert unreachable code.

Basic usage:

```ts
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

Deno.test({
  name: "testing example",
  fn(): void {
    assertEquals("world", "world");
    assertEquals({ hello: "world" }, { hello: "world" });
  },
});
```

Short syntax (named function instead of object):

```ts
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

Deno.test("example", function (): void {
  assertEquals("world", "world");
  assertEquals({ hello: "world" }, { hello: "world" });
});
```

Using `assertStrictEquals()`:

```ts
import { assertStrictEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

Deno.test("isStrictlyEqual", function (): void {
  const a = {};
  const b = a;
  assertStrictEquals(a, b);
});

// This test fails
Deno.test("isNotStrictlyEqual", function (): void {
  const a = {};
  const b = {};
  assertStrictEquals(a, b);
});
```

Using `assertSnapshot()`:

For more usage information, see [Snapshot Testing](#snapshot-testing).

```ts
import { assertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";

Deno.test("isSnapshotMatch", async function (t): Promise<void> {
  const a = {
    hello: "world!",
    example: 123,
  };
  await assertSnapshot(t, a);
});
```

Using `assertThrows()`:

```ts
import { assertThrows } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

Deno.test("doesThrow", function (): void {
  assertThrows((): void => {
    throw new TypeError("hello world!");
  });
  assertThrows((): void => {
    throw new TypeError("hello world!");
  }, TypeError);
  assertThrows(
    (): void => {
      throw new TypeError("hello world!");
    },
    TypeError,
    "hello",
  );
});

// This test will not pass.
Deno.test("fails", function (): void {
  assertThrows((): void => {
    console.log("Hello world");
  });
});
```

Using `assertRejects()`:

```ts
import { assertRejects } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

Deno.test("doesThrow", async function () {
  await assertRejects(
    async () => {
      throw new TypeError("hello world!");
    },
  );
  await assertRejects(async () => {
    throw new TypeError("hello world!");
  }, TypeError);
  await assertRejects(
    async () => {
      throw new TypeError("hello world!");
    },
    TypeError,
    "hello",
  );
  await assertRejects(
    async () => {
      return Promise.reject(new Error());
    },
  );
});

// This test will not pass.
Deno.test("fails", async function () {
  await assertRejects(
    async () => {
      console.log("Hello world");
    },
  );
});
```

## Snapshot Testing

### Basic usage:

The `assertSnapshot` function will create a snapshot of a value and compare it
to a reference snapshot, which is stored alongside the test file in the
`__snapshots__` directory.

```ts
// example_test.ts
import { assertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";

Deno.test("isSnapshotMatch", async function (t): Promise<void> {
  const a = {
    hello: "world!",
    example: 123,
  };
  await assertSnapshot(t, a);
});
```

```js
// __snapshots__/example_test.ts.snap
export const snapshot = {};

snapshot[`isSnapshotMatch 1`] = `
{
  example: 123,
  hello: "world!",
}
`;
```

Calling `assertSnapshot` in a test will throw an `AssertionError`, causing the
test to fail, if the snapshot created during the test does not match the one in
the snapshot file.

### Updating Snapshots:

When adding new snapshot assertions to your test suite, or when intentionally
making changes which cause your snapshots to fail, you can update your snapshots
by running the snapshot tests in update mode. Tests can be run in update mode by
passing the `--update` or `-u` flag as an argument when running the test. When
this flag is passed, then any snapshots which do not match will be updated.

```sh
deno test --allow-all -- --update
```

Note: In Powershell, you need to quote `--`.

```powershell
deno test --allow-all "--" --update
```

Additionally, new snapshots will only be created when this flag is present.

### Permissions:

When running snapshot tests, the `--allow-read` permission must be enabled, or
else any calls to `assertSnapshot` will fail due to insufficient permissions.
Additionally, when updating snapshots, the `--allow-write` permission must also
be enabled, as this is required in order to update snapshot files.

The `assertSnapshot` function will only attempt to read from and write to
snapshot files. As such, the allow list for `--allow-read` and `--allow-write`
can be limited to only include existing snapshot files, if so desired.

### Options:

The `assertSnapshot` function optionally accepts an options object.

```ts
// example_test.ts
import { assertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";

Deno.test("isSnapshotMatch", async function (t): Promise<void> {
  const a = {
    hello: "world!",
    example: 123,
  };
  await assertSnapshot(t, a, {
    // options
  });
});
```

You can also configure default options for `assertSnapshot`.

```ts
// example_test.ts
import { createAssertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";

const assertSnapshot = createAssertSnapshot({
  // options
});
```

When configuring default options like this, the resulting `assertSnapshot`
function will function the same as the default function exported from the
snapshot module. If passed an optional options object, this will take precedence
over the default options, where the value provded for an option differs.

It is possible to "extend" an `assertSnapshot` function which has been
configured with default options.

```ts
// example_test.ts
import { createAssertSnapshot } from "https://deno.land/std@$STD_VERSION/testing/snapshot.ts";
import { stripColor } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";

const assertSnapshot = createAssertSnapshot({
  dir: ".snaps",
});

const assertMonochromeSnapshot = createAssertSnapshot<string>(
  { serializer: stripColor },
  assertSnapshot,
);

Deno.test("isSnapshotMatch", async function (t): Promise<void> {
  const a = "\x1b[32mThis green text has had it's colours stripped\x1b[39m";
  await assertMonochromeSnapshot(t, a);
});
```

```js
// .snaps/example_test.ts.snap
export const snapshot = {};

snapshot[`isSnapshotMatch 1`] = `This green text has had it's colours stripped`;
```

### Version Control:

Snapshot testing works best when changes to snapshot files are comitted
alongside other code changes. This allows for changes to reference snapshots to
be reviewed along side the code changes that caused them, and ensures that when
others pull your changes, their tests will pass without needing to update
snapshots locally.

## Benching

These APIs are deprecated. Use Deno.bench() instead. See
https://doc.deno.land/deno/unstable/~/Deno.bench for more details.

### Basic usage:

Benchmarks can be registered using the `bench` function, where you can define a
code, that should be benchmarked. `b.start()` has to be called at the start of
the part you want to benchmark and `b.stop()` at the end of it, otherwise an
error will be thrown.

After that simply calling `runBenchmarks()` will benchmark all registered
benchmarks and log the results in the commandline.

```ts
import {
  bench,
  runBenchmarks,
} from "https://deno.land/std@$STD_VERSION/testing/bench.ts";

bench(function forIncrementX1e9(b): void {
  b.start();
  for (let i = 0; i < 1e9; i++);
  b.stop();
});

runBenchmarks();
```

Averaging execution time over multiple runs:

```ts
import { bench } from "https://deno.land/std@$STD_VERSION/testing/bench.ts";

bench({
  name: "runs100ForIncrementX1e6",
  runs: 100,
  func(b): void {
    b.start();
    for (let i = 0; i < 1e6; i++);
    b.stop();
  },
});
```

Running specific benchmarks using regular expressions:

```ts
import {
  runBenchmarks,
} from "https://deno.land/std@$STD_VERSION/testing/bench.ts";

runBenchmarks({ only: /desired/, skip: /exceptions/ });
```

### Processing benchmark results

`runBenchmarks()` returns a `Promise<BenchmarkRunResult>`, so you can process
the benchmarking results yourself. It contains detailed results of each
benchmark's run as `BenchmarkResult` s.

```ts
import {
  BenchmarkRunResult,
  runBenchmarks,
} from "https://deno.land/std@$STD_VERSION/testing/bench.ts";

runBenchmarks()
  .then((results: BenchmarkRunResult) => {
    console.log(results);
  })
  .catch((error: Error) => {
    // ... errors if benchmark was badly constructed.
  });
```

### Processing benchmarking progress

`runBenchmarks()` accepts an optional progress handler callback function, so you
can get information on the progress of the running benchmarking.

Using `{ silent: true }` means you wont see the default progression logs in the
commandline.

```ts
import {
  BenchmarkRunProgress,
  ProgressState,
  runBenchmarks,
} from "https://deno.land/std@$STD_VERSION/testing/bench.ts";

runBenchmarks({ silent: true }, (p: BenchmarkRunProgress) => {
  // initial progress data.
  if (p.state === ProgressState.BenchmarkingStart) {
    console.log(
      `Starting benchmarking. Queued: ${
        p.queued!.length
      }, filtered: ${p.filtered}`,
    );
  }
  // ...
});
```

#### Benching API

These APIs are deprecated. Use Deno.bench() instead. See
https://doc.deno.land/deno/unstable/~/Deno.bench for more details.

##### `bench(benchmark: BenchmarkDefinition | BenchmarkFunction): void`

Registers a benchmark that will be run once `runBenchmarks` is called.

##### `runBenchmarks(opts?: BenchmarkRunOptions, progressCb?: (p: BenchmarkRunProgress) => void | Promise<void>): Promise<BenchmarkRunResult>`

Runs all registered benchmarks serially. Filtering can be applied by setting
`BenchmarkRunOptions.only` and/or `BenchmarkRunOptions.skip` to regular
expressions matching benchmark names. Default progression logs can be turned off
with the `BenchmarkRunOptions.silent` flag.

##### `clearBenchmarks(opts?: BenchmarkClearOptions): void`

Clears all registered benchmarks, so calling `runBenchmarks()` after it wont run
them. Filtering can be applied by setting `BenchmarkRunOptions.only` and/or
`BenchmarkRunOptions.skip` to regular expressions matching benchmark names.

## Behavior-driven development

With the `bdd.ts` module you can write your tests in a familiar format for
grouping tests and adding setup/teardown hooks used by other JavaScript testing
frameworks like Jasmine, Jest, and Mocha.

The `describe` function creates a block that groups together several related
tests. The `it` function registers an individual test case.

### Hooks

There are 4 types of hooks available for test suites. A test suite can have
multiples of each type of hook, they will be called in the order that they are
registered. The `afterEach` and `afterAll` hooks will be called whether or not
the test case passes. The *All hooks will be called once for the whole group
while the *Each hooks will be called for each individual test case.

- `beforeAll`: Runs before all of the tests in the test suite.
- `afterAll`: Runs after all of the tests in the test suite finish.
- `beforeEach`: Runs before each of the individual test cases in the test suite.
- `afterEach`: Runs after each of the individual test cases in the test suite.

If a hook is registered at the top level, a global test suite will be registered
and all tests will belong to it. Hooks registered at the top level must be
registered before any individual test cases or test suites.

### Focusing tests

If you would like to run only specific test cases, you can do so by calling
`it.only` instead of `it`. If you would like to run only specific test suites,
you can do so by calling `describe.only` instead of `describe`.

There is one limitation to this when using the flat test grouping style. When
`describe` is called without being nested, it registers the test with
`Deno.test`. If a child test case or suite is registered with `it.only` or
`describe.only`, it will be scoped to the top test suite instead of the file. To
make them the only tests that run in the file, you would need to register the
top test suite with `describe.only` too.

### Ignoring tests

If you would like to not run specific individual test cases, you can do so by
calling `it.ignore` instead of `it`. If you would like to not run specific test
suites, you can do so by calling `describe.ignore` instead of `describe`.

### Sanitization options

Like `Deno.TestDefinition`, the `DescribeDefinition` and `ItDefinition` have
sanitization options. They work in the same way.

- `sanitizeExit`: Ensure the test case does not prematurely cause the process to
  exit, for example via a call to Deno.exit. Defaults to true.
- `sanitizeOps`: Check that the number of async completed ops after the test is
  the same as number of dispatched ops. Defaults to true.
- `sanitizeResources`: Ensure the test case does not "leak" resources - ie. the
  resource table after the test has exactly the same contents as before the
  test. Defaults to true.

### Permissions option

Like `Deno.TestDefinition`, the `DescribeDefintion` and `ItDefinition` have a
`permissions` option. They specify the permissions that should be used to run an
individual test case or test suite. Set this to `"inherit"` to keep the calling
thread's permissions. Set this to `"none"` to revoke all permissions.

This setting defaults to `"inherit"`.

There is currently one limitation to this, you cannot use the permissions option
on an individual test case or test suite that belongs to another test suite.
That's because internally those tests are registered with `t.step` which does
not support the permissions option.

### Comparing to Deno\.test

The default way of writing tests is using `Deno.test` and `t.step`. The
`describe` and `it` functions have similar call signatures to `Deno.test`,
making it easy to switch between the default style and the behavior-driven
development style of writing tests. Internally, `describe` and `it` are
registering tests with `Deno.test` and `t.step`.

Below is an example of a test file using `Deno.test` and `t.step`. In the
following sections there are examples of how the same test could be written with
`describe` and `it` using nested test grouping, flat test grouping, or a mix of
both styles.

```ts
// https://deno.land/std@$STD_VERSION/testing/bdd_examples/user_test.ts
import {
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import { User } from "https://deno.land/std@$STD_VERSION/testing/bdd_examples/user.ts";

Deno.test("User.users initially empty", () => {
  assertEquals(User.users.size, 0);
});

Deno.test("User constructor", () => {
  try {
    const user = new User("Kyle");
    assertEquals(user.name, "Kyle");
    assertStrictEquals(User.users.get("Kyle"), user);
  } finally {
    User.users.clear();
  }
});

Deno.test("User age", async (t) => {
  const user = new User("Kyle");

  await t.step("getAge", () => {
    assertThrows(() => user.getAge(), Error, "Age unknown");
    user.age = 18;
    assertEquals(user.getAge(), 18);
  });

  await t.step("setAge", () => {
    user.setAge(18);
    assertEquals(user.getAge(), 18);
  });
});
```

#### Nested test grouping

Tests created within the callback of a `describe` function call will belong to
the new test suite it creates. The hooks can be created within it or be added to
the options argument for describe.

```ts
// https://deno.land/std@$STD_VERSION/testing/bdd_examples/user_nested_test.ts
import {
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@$STD_VERSION/testing/bdd.ts";
import { User } from "https://deno.land/std@$STD_VERSION/testing/bdd_examples/user.ts";

describe("User", () => {
  it("users initially empty", () => {
    assertEquals(User.users.size, 0);
  });

  it("constructor", () => {
    try {
      const user = new User("Kyle");
      assertEquals(user.name, "Kyle");
      assertStrictEquals(User.users.get("Kyle"), user);
    } finally {
      User.users.clear();
    }
  });

  describe("age", () => {
    let user: User;

    beforeEach(() => {
      user = new User("Kyle");
    });

    afterEach(() => {
      User.users.clear();
    });

    it("getAge", function () {
      assertThrows(() => user.getAge(), Error, "Age unknown");
      user.age = 18;
      assertEquals(user.getAge(), 18);
    });

    it("setAge", function () {
      user.setAge(18);
      assertEquals(user.getAge(), 18);
    });
  });
});
```

#### Flat test grouping

The `describe` function returns a unique symbol that can be used to reference
the test suite for adding tests to it without having to create them within a
callback. The gives you the ability to have test grouping without any extra
indentation in front of the grouped tests.

```ts
// https://deno.land/std@$STD_VERSION/testing/bdd_examples/user_flat_test.ts
import {
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import {
  describe,
  it,
} from "https://deno.land/std@$STD_VERSION/testing/bdd.ts";
import { User } from "https://deno.land/std@$STD_VERSION/testing/bdd_examples/user.ts";

const userTests = describe("User");

it(userTests, "users initially empty", () => {
  assertEquals(User.users.size, 0);
});

it(userTests, "constructor", () => {
  try {
    const user = new User("Kyle");
    assertEquals(user.name, "Kyle");
    assertStrictEquals(User.users.get("Kyle"), user);
  } finally {
    User.users.clear();
  }
});

const ageTests = describe({
  name: "age",
  suite: userTests,
  beforeEach(this: { user: User }) {
    this.user = new User("Kyle");
  },
  afterEach() {
    User.users.clear();
  },
});

it(ageTests, "getAge", function () {
  const { user } = this;
  assertThrows(() => user.getAge(), Error, "Age unknown");
  user.age = 18;
  assertEquals(user.getAge(), 18);
});

it(ageTests, "setAge", function () {
  const { user } = this;
  user.setAge(18);
  assertEquals(user.getAge(), 18);
});
```

#### Mixed test grouping

Both nested test grouping and flat test grouping can be used together. This can
be useful if you'd like to create deep groupings without all the extra
indentation in front of each line.

```ts
// https://deno.land/std@$STD_VERSION/testing/bdd_examples/user_mixed_test.ts
import {
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import {
  describe,
  it,
} from "https://deno.land/std@$STD_VERSION/testing/bdd.ts";
import { User } from "https://deno.land/std@$STD_VERSION/testing/bdd_examples/user.ts";

describe("User", () => {
  it("users initially empty", () => {
    assertEquals(User.users.size, 0);
  });

  it("constructor", () => {
    try {
      const user = new User("Kyle");
      assertEquals(user.name, "Kyle");
      assertStrictEquals(User.users.get("Kyle"), user);
    } finally {
      User.users.clear();
    }
  });

  const ageTests = describe({
    name: "age",
    beforeEach(this: { user: User }) {
      this.user = new User("Kyle");
    },
    afterEach() {
      User.users.clear();
    },
  });

  it(ageTests, "getAge", function () {
    const { user } = this;
    assertThrows(() => user.getAge(), Error, "Age unknown");
    user.age = 18;
    assertEquals(user.getAge(), 18);
  });

  it(ageTests, "setAge", function () {
    const { user } = this;
    user.setAge(18);
    assertEquals(user.getAge(), 18);
  });
});
```

## Mocking

Test spies are function stand-ins that are used to assert if a function's
internal behavior matches expectations. Test spies on methods keep the original
behavior but allow you to test how the method is called and what it returns.
Test stubs are an extension of test spies that also replaces the original
methods behavior.

### Spying

Say we have two functions, `square` and `multiply`, if we want to assert that
the `multiply` function is called during execution of the `square` function we
need a way to spy on the `multiply` function. There are a few ways to achieve
this with Spies, one is to have the `square` function take the `multiply`
multiply as a parameter.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/parameter_injection.ts
export function multiply(a: number, b: number): number {
  return a * b;
}

export function square(
  multiplyFn: (a: number, b: number) => number,
  value: number,
): number {
  return multiplyFn(value, value);
}
```

This way, we can call `square(multiply, value)` in the application code or wrap
a spy function around the `multiply` function and call
`square(multiplySpy, value)` in the testing code.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/parameter_injection_test.ts
import {
  assertSpyCall,
  assertSpyCalls,
  spy,
} from "https://deno.land/std@$STD_VERSION/testing/mock.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import {
  multiply,
  square,
} from "https://deno.land/std@$STD_VERSION/testing/mock_examples/parameter_injection.ts";

Deno.test("square calls multiply and returns results", () => {
  const multiplySpy = spy(multiply);

  assertEquals(square(multiplySpy, 5), 25);

  // asserts that multiplySpy was called at least once and details about the first call.
  assertSpyCall(multiplySpy, 0, {
    args: [5, 5],
    returned: 25,
  });

  // asserts that multiplySpy was only called once.
  assertSpyCalls(multiplySpy, 1);
});
```

If you prefer not adding additional parameters for testing purposes only, you
can use spy to wrap a method on an object instead. In the following example, the
exported `_internals` object has the `multiply` function we want to call as a
method and the `square` function calls `_internals.multiply` instead of
`multiply`.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/internals_injection.ts
export function multiply(a: number, b: number): number {
  return a * b;
}

export function square(value: number): number {
  return _internals.multiply(value, value);
}

export const _internals = { multiply };
```

This way, we can call `square(value)` in both the application code and testing
code. Then spy on the `multiply` method on the `_internals` object in the
testing code to be able to spy on how the `square` function calls the `multiply`
function.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/internals_injection_test.ts
import {
  assertSpyCall,
  assertSpyCalls,
  spy,
} from "https://deno.land/std@$STD_VERSION/testing/mock.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import {
  _internals,
  square,
} from "https://deno.land/std@$STD_VERSION/testing/mock_examples/internals_injection.ts";

Deno.test("square calls multiply and returns results", () => {
  const multiplySpy = spy(_internals, "multiply");

  try {
    assertEquals(square(5), 25);
  } finally {
    // unwraps the multiply method on the _internals object
    multiplySpy.restore();
  }

  // asserts that multiplySpy was called at least once and details about the first call.
  assertSpyCall(multiplySpy, 0, {
    args: [5, 5],
    returned: 25,
  });

  // asserts that multiplySpy was only called once.
  assertSpyCalls(multiplySpy, 1);
});
```

One difference you may have noticed between these two examples is that in the
second we call the `restore` method on `multiplySpy` function. That is needed to
remove the spy wrapper from the `_internals` object's `multiply` method. The
`restore` method is called in a finally block to ensure that it is restored
whether or not the assertion in the try block is successful. The `restore`
method didn't need to be called in the first example because the `multiply`
function was not modified in any way like the `_internals` object was in the
second example.

### Stubbing

Say we have two functions, `randomMultiple` and `randomInt`, if we want to
assert that `randomInt` is called during execution of `randomMultiple` we need a
way to spy on the `randomInt` function. That could be done with either of the
spying techniques previously mentioned. To be able to verify that the
`randomMultiple` function returns the value we expect it to for what `randomInt`
returns, the easiest way would be to replace the `randomInt` function's behavior
with more predictable behavior.

You could use the first spying technique to do that but that would require
adding a `randomInt` parameter to the `randomMultiple` function.

You could also use the second spying technique to do that, but your assertions
would not be as predictable due to the `randomInt` function returning random
values.

Say we want to verify it returns correct values for both negative and positive
random integers. We could easily do that with stubbing. The below example is
similar to the second spying technique example but instead of passing the call
through to the original `randomInt` function, we are going to replace
`randomInt` with a function that returns pre-defined values.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/random.ts
export function randomInt(lowerBound: number, upperBound: number): number {
  return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound));
}

export function randomMultiple(value: number): number {
  return value * _internals.randomInt(-10, 10);
}

export const _internals = { randomInt };
```

The mock module includes some helper functions to make creating common stubs
easy. The `returnsNext` function takes an array of values we want it to return
on consecutive calls.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/random_test.ts
import {
  assertSpyCall,
  assertSpyCalls,
  returnsNext,
  stub,
} from "https://deno.land/std@$STD_VERSION/testing/mock.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
import {
  _internals,
  randomMultiple,
} from "https://deno.land/std@$STD_VERSION/testing/mock_examples/random.ts";

Deno.test("randomMultiple uses randomInt to generate random multiples between -10 and 10 times the value", () => {
  const randomIntStub = stub(_internals, "randomInt", returnsNext([-3, 3]));

  try {
    assertEquals(randomMultiple(5), -15);
    assertEquals(randomMultiple(5), 15);
  } finally {
    // unwraps the randomInt method on the _internals object
    randomIntStub.restore();
  }

  // asserts that randomIntStub was called at least once and details about the first call.
  assertSpyCall(randomIntStub, 0, {
    args: [-10, 10],
    returned: -3,
  });
  // asserts that randomIntStub was called at least twice and details about the second call.
  assertSpyCall(randomIntStub, 1, {
    args: [-10, 10],
    returned: 3,
  });

  // asserts that randomIntStub was only called twice.
  assertSpyCalls(randomIntStub, 2);
});
```

### Faking time

Say we have a function that has time based behavior that we would like to test.
With real time, that could cause tests to take much longer than they should. If
you fake time, you could simulate how your function would behave over time
starting from any point in time. Below is an example where we want to test that
the callback is called every second.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/interval.ts
export function secondInterval(cb: () => void): number {
  return setInterval(cb, 1000);
}
```

With `FakeTime` we can do that. When the `FakeTime` instance is created, it
splits from real time. The `Date`, `setTimeout`, `clearTimeout`, `setInterval`
and `clearInterval` globals are replaced with versions that use the fake time
until real time is restored. You can control how time ticks forward with the
`tick` method on the `FakeTime` instance.

```ts
// https://deno.land/std@$STD_VERSION/testing/mock_examples/interval_test.ts
import {
  assertSpyCalls,
  spy,
} from "https://deno.land/std@$STD_VERSION/testing/mock.ts";
import { FakeTime } from "https://deno.land/std@$STD_VERSION/testing/time.ts";
import { secondInterval } from "https://deno.land/std@$STD_VERSION/testing/mock_examples/interval.ts";

Deno.test("secondInterval calls callback every second and stops after being cleared", () => {
  const time = new FakeTime();

  try {
    const cb = spy();
    const intervalId = secondInterval(cb);
    assertSpyCalls(cb, 0);
    time.tick(500);
    assertSpyCalls(cb, 0);
    time.tick(500);
    assertSpyCalls(cb, 1);
    time.tick(3500);
    assertSpyCalls(cb, 4);

    clearInterval(intervalId);
    time.tick(1000);
    assertSpyCalls(cb, 4);
  } finally {
    time.restore();
  }
});
```
