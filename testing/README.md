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
- `assertStringIncludes()` - Make an assertion that `actual` includes
  `expected`.
- `assertMatch()` - Make an assertion that `actual` match RegExp `expected`.
- `assertNotMatch()` - Make an assertion that `actual` not match RegExp
  `expected`.
- `assertArrayIncludes()` - Make an assertion that `actual` array includes the
  `expected` values.
- `assertObjectMatch()` - Make an assertion that `actual` object match
  `expected` subset object
- `assertThrows()` - Expects the passed `fn` to throw. If `fn` does not throw,
  this function does. Also compares any errors thrown to an optional expected
  `Error` class and checks that the error `.message` includes an optional
  string.
- `assertRejects()` - Expects the passed `fn` to be async and throw and return a
  `Promise` that rejects. If the `fn` does not throw or reject, this function
  will reject _(⚠️ you should normally await this assertion)_. Also optionally
  accepts an Error class which the expected error must be an instance of, and a
  string which must be a substring of the error's `.message`.
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

## Benching

With this module you can benchmark your code and get information on how is it
performing.

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
tests. The `it` function registers an individual test case. The `describe` and
`it` functions have similar call signatures to `Deno.test`, making it easy to
migrate from using `Deno.test`.

### Hooks

There are 4 types of hooks available for test suites. A test suite can have
multiples of each type of hook, they will be called in the order that they are
registered. The `afterEach` and `afterAll` hooks will be called whether or not
the test case passes. The all hooks will be called once for the whole group
while the each hooks will be called for each individual test case.

- `beforeAll`: Runs before all of the tests in the test suite.
- `afterAll`: Runs after all of the tests in the test suite finish.
- `beforeEach`: Runs before each of the individual test cases in the test suite.
- `afterEach`: Runs after each of the individual test cases in the test suite.

If a hook is registered at the top level, a global test suite will be registered
and all tests will belong to it. Hooks registered at the top level must be
registered before any individual test cases or test suites.

### Focusing tests

If you would like to only run specific individual test cases, you can do so by
calling `it.only` instead of `it`. If you would like to only run specific test
suites, you can do so by calling `describe.only` instead of `describe`.

There is one limitation to this when the individual test cases or test suites
belong to another test suite, they will be the only ones to run within the top
level test suite.

### Ignoring tests

If you would like to not run specific individual test cases, you can do so by
calling `it.ignore` instead of `it`. If you would like to only run specific test
suites, you can do so by calling `describe.ignore` instead of `describe`.

### Sanitization options

Like `Deno.TestDefinition`, the `DescribeDefinition` and `ItDefinition` have
sanitization options. They work in the same way.

- sanitizeExit: Ensure the test case does not prematurely cause the process to
  exit, for example via a call to Deno.exit. Defaults to true.
- sanitizeOps: Check that the number of async completed ops after the test is
  the same as number of dispatched ops. Defaults to true.
- sanitizeResources: Ensure the test case does not "leak" resources - ie. the
  resource table after the test has exactly the same contents as before the
  test. Defaults to true.

### Permissions option

Like `Deno.TestDefinition`, the `DescribeDefintion` and `ItDefinition` have a
permissions option. They specify the permissions that should be used to run an
individual test case or test suite. Set this to "inherit" to keep the calling
thread's permissions. Set this to "none" to revoke all permissions.

Defaults to "inherit".

There is currently one limitation to this, you cannot use the permissions option
on an individual test case or test suite that belongs to another test suite.

### Migrating and usage

To migrate from `Deno.test`, all you have to do is replace `Deno.test` with
`it`. If you are using the step API, you will need to replace `Deno.test` with
describe and steps with `describe` or `it`. The callback for individual test
cases can be syncronous or asyncronous.

Below is an example of a test file using `Deno.test` and `t.step`. In the
following sections there are examples of how it can be converted to using nested
test grouping, flat test grouping, and a mix of both.

```ts
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
