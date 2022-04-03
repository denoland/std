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

## Mocking

Test spies are function stand-ins that are used to assert if a function's
internal behavior matches expectations. Test spies on methods keep the original
behavior but allow you to test how the method is called and what it returns.
Test stubs are an extension of test spies that also replaces the original
methods behavior.

### Spying

Say we have two functions, `square` and `multiply`, if we want to assert that
the `multiply` function is called during execution of the `square` function we
need a way to spy on the `multiple` function. There are a few ways to achieve
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
way to spy on the `randomInt` function. That could be done with either either of
the spying techniques previously mentioned. To be able to verify that the
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
