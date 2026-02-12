// Copyright 2018-2026 the Deno authors. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { type MemoizationCacheResult, memoize } from "./memoize.ts";
import { LruCache } from "./lru_cache.ts";
import { FakeTime } from "@std/testing/time";

Deno.test(
  "memoize() memoizes nullary function (lazy/singleton)",
  async (t) => {
    await t.step("async function", async () => {
      let numTimesCalled = 0;

      const db = {
        connect() {
          ++numTimesCalled;
          return Promise.resolve({});
        },
      };

      const getConn = memoize(async () => await db.connect());
      const conn = await getConn();
      assertEquals(numTimesCalled, 1);
      const conn2 = await getConn();
      // equal by reference
      assert(conn2 === conn);
      assertEquals(numTimesCalled, 1);
    });

    await t.step("sync function", async () => {
      using time = new FakeTime();

      const firstHitDate = memoize(() => new Date());

      const date = firstHitDate();

      await time.tickAsync(10);

      const date2 = firstHitDate();

      assertEquals(date, date2);
    });
  },
);

Deno.test("memoize() allows simple memoization with primitive arg", () => {
  let numTimesCalled = 0;
  const fn = memoize((n: number) => {
    ++numTimesCalled;
    return 0 - n;
  });

  assertEquals(fn(42), -42);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(42), -42);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(888), -888);
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() is performant for expensive fibonacci function", () => {
  // Typically should take a maximum of a couple of milliseconds, but this
  // test is really just a smoke test to make sure the memoization is working
  // correctly, so we don't set a deadline to make sure it isn't flaky
  // dependent on hardware, test runner, etc.

  const fib = memoize((n: bigint): bigint => {
    return n <= 2n ? 1n : fib(n - 1n) + fib(n - 2n);
  });

  assertEquals(fib(100n), 354224848179261915075n);
});

Deno.test("memoize() allows multiple primitive args", () => {
  let numTimesCalled = 0;
  const fn = memoize((a: number, b: number) => {
    ++numTimesCalled;
    return a + b;
  });

  assertEquals(fn(7, 8), 15);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(7, 8), 15);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(7, 9), 16);
  assertEquals(numTimesCalled, 2);
  assertEquals(fn(8, 7), 15);
  assertEquals(numTimesCalled, 3);
});

Deno.test("memoize() allows ...spread primitive args", () => {
  let numTimesCalled = 0;
  const fn = memoize((...ns: number[]) => {
    ++numTimesCalled;
    return ns.reduce((total, val) => total + val, 0);
  });

  assertEquals(fn(), 0);
  assertEquals(fn(), 0);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(7), 7);
  assertEquals(fn(7), 7);
  assertEquals(numTimesCalled, 2);
  assertEquals(fn(7, 8), 15);
  assertEquals(fn(7, 8), 15);
  assertEquals(numTimesCalled, 3);
  assertEquals(fn(7, 8, 9), 24);
  assertEquals(fn(7, 8, 9), 24);
  assertEquals(numTimesCalled, 4);
});

Deno.test(
  "memoize() caches unary function by all passed args by default (implicit extra args as array callback)",
  () => {
    let numTimesCalled = 0;
    const fn = memoize((n: number) => {
      ++numTimesCalled;
      return 0 - n;
    });

    assertEquals([1, 1, 2, 2].map(fn), [-1, -1, -2, -2]);
    assertEquals(numTimesCalled, 4);
  },
);

Deno.test("memoize() preserves `this` binding`", () => {
  class X {
    readonly key = "CONSTANT";
    timesCalled = 0;

    #method() {
      return 1;
    }

    method() {
      ++this.timesCalled;
      return this.#method();
    }
  }

  const x = new X();

  const method = x.method.bind(x);

  const fn = memoize(method);
  assertEquals(fn(), 1);

  const fn2 = memoize(x.method).bind(x);
  assertEquals(fn2(), 1);
});

// based on https://github.com/lodash/lodash/blob/4.17.15/test/test.js#L14704-L14716
Deno.test("memoize() uses `this` binding of function for `getKey`", () => {
  type Obj = { b: number; c: number; memoized: (a: number) => number };

  let numTimesCalled = 0;

  const fn = function (this: Obj, a: number) {
    ++numTimesCalled;
    return a + this.b + this.c;
  };
  const getKey = function (this: Obj, a: number) {
    return JSON.stringify([a, this.b, this.c]);
  };

  const memoized = memoize(fn, { getKey });

  const obj: Obj = { memoized, "b": 2, "c": 3 };
  assertEquals(obj.memoized(1), 6);
  assertEquals(numTimesCalled, 1);

  assertEquals(obj.memoized(1), 6);
  assertEquals(numTimesCalled, 1);

  obj.b = 3;
  obj.c = 5;
  assertEquals(obj.memoized(1), 9);
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() allows reference arg with default caching", () => {
  let numTimesCalled = 0;
  const fn = memoize((sym: symbol) => {
    ++numTimesCalled;
    return sym;
  });
  const sym1 = Symbol();
  const sym2 = Symbol();

  fn(sym1);
  assertEquals(numTimesCalled, 1);
  fn(sym1);
  assertEquals(numTimesCalled, 1);
  fn(sym2);
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() allows multiple reference args with default caching", () => {
  let numTimesCalled = 0;
  const fn = memoize((obj1: unknown, obj2: unknown) => {
    ++numTimesCalled;
    return { obj1, obj2 };
  });
  const obj1 = {};
  const obj2 = {};

  fn(obj1, obj1);
  assertEquals(numTimesCalled, 1);
  fn(obj1, obj1);
  assertEquals(numTimesCalled, 1);
  fn(obj1, obj2);
  assertEquals(numTimesCalled, 2);
  fn(obj2, obj2);
  assertEquals(numTimesCalled, 3);
  fn(obj2, obj1);
  assertEquals(numTimesCalled, 4);
});

Deno.test("memoize() allows non-primitive arg with `getKey`", () => {
  let numTimesCalled = 0;
  const fn = memoize((d: Date) => {
    ++numTimesCalled;
    return new Date(0 - d.valueOf());
  }, { getKey: (n) => n.valueOf() });
  const date1 = new Date(42);
  const date2 = new Date(888);

  assertEquals(fn(date1), new Date(-42));
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(date1), new Date(-42));
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(date2), new Date(-888));
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() allows non-primitive arg with `getKey`", () => {
  const fn = memoize(({ value }: { cacheKey: number; value: number }) => {
    return value;
  }, { getKey: ({ cacheKey }) => cacheKey });

  assertEquals(fn({ cacheKey: 1, value: 2 }), 2);
  assertEquals(fn({ cacheKey: 1, value: 99 }), 2);
  assertEquals(fn({ cacheKey: 2, value: 99 }), 99);
});

Deno.test(
  "memoize() allows multiple non-primitive args with `getKey` returning primitive",
  () => {
    let numTimesCalled = 0;

    const fn = memoize((...args: { val: number }[]) => {
      ++numTimesCalled;
      return args.reduce((total, { val }) => total + val, 0);
    }, { getKey: (...args) => JSON.stringify(args) });

    assertEquals(fn({ val: 1 }, { val: 2 }), 3);
    assertEquals(numTimesCalled, 1);
    assertEquals(fn({ val: 1 }, { val: 2 }), 3);
    assertEquals(numTimesCalled, 1);
    assertEquals(fn({ val: 2 }, { val: 1 }), 3);
    assertEquals(numTimesCalled, 2);
  },
);

Deno.test(
  "memoize() allows multiple non-primitive args with `getKey` returning stringified array of primitives",
  () => {
    let numTimesCalled = 0;

    const fn = memoize((...args: { val: number }[]) => {
      ++numTimesCalled;
      return args.reduce((total, { val }) => total + val, 0);
    }, { getKey: (...args) => JSON.stringify(args.map((arg) => arg.val)) });

    assertEquals(fn({ val: 1 }, { val: 2 }), 3);
    assertEquals(numTimesCalled, 1);
    assertEquals(fn({ val: 1 }, { val: 2 }), 3);
    assertEquals(numTimesCalled, 1);
    assertEquals(fn({ val: 2 }, { val: 1 }), 3);
    assertEquals(numTimesCalled, 2);
  },
);

Deno.test(
  "memoize() allows multiple non-primitive args of different types, `getKey` returning custom string from props",
  () => {
    let numTimesCalled = 0;

    const fn = memoize((one: { one: number }, two: { two: number }) => {
      ++numTimesCalled;
      return one.one + two.two;
    }, { getKey: (one, two) => `${one.one},${two.two}` });

    assertEquals(fn({ one: 1 }, { two: 2 }), 3);
    assertEquals(numTimesCalled, 1);
    assertEquals(fn({ one: 1 }, { two: 2 }), 3);
    assertEquals(numTimesCalled, 1);
    assertEquals(fn({ one: 2 }, { two: 1 }), 3);
    assertEquals(numTimesCalled, 2);
  },
);

Deno.test("memoize() allows primitive arg with `getKey`", () => {
  let numTimesCalled = 0;
  const fn = memoize((arg: string | number | boolean) => {
    ++numTimesCalled;

    try {
      return JSON.parse(String(arg)) as string | number | boolean;
    } catch {
      return arg;
    }
  }, { getKey: (arg) => String(arg) });

  assertEquals(fn("true"), true);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(true), true);
  assertEquals(numTimesCalled, 1);

  assertEquals(fn("42"), 42);
  assertEquals(numTimesCalled, 2);
  assertEquals(fn(42), 42);
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() works with async functions", async () => {
  using time = new FakeTime();

  // wait time per call of the original (un-memoized) function
  const DELAY_MS = 100;

  const startTime = Date.now();
  const fn = memoize(async (n: number) => {
    await time.tickAsync(DELAY_MS);
    return 0 - n;
  });

  const nums = [42, 888, 42, 42, 42, 42, 888, 888, 888, 888];
  const expected = [-42, -888, -42, -42, -42, -42, -888, -888, -888, -888];
  const results: number[] = [];

  // call in serial to test time elapsed
  for (const num of nums) {
    results.push(await fn(num));
  }

  assertEquals(results, expected);

  const numUnique = new Set(nums).size;

  assertAlmostEquals(
    Date.now() - startTime,
    numUnique * DELAY_MS,
    nums.length,
  );
});

Deno.test(
  "memoize() doesn’t cache rejected promises for future function calls",
  async () => {
    let rejectNext = true;
    const fn = memoize(async (n: number) => {
      await Promise.resolve();
      const thisCallWillReject = rejectNext;
      rejectNext = !rejectNext;
      if (thisCallWillReject) {
        throw new Error();
      }
      return 0 - n;
    });

    // first call rejects
    await assertRejects(() => fn(42));
    // second call succeeds (rejected response is discarded)
    assertEquals(await fn(42), -42);
    // subsequent calls also succeed (successful response from cache is used)
    assertEquals(await fn(42), -42);
  },
);

Deno.test(
  "memoize() causes async functions called in parallel to return the same promise (even if rejected)",
  async () => {
    let rejectNext = true;
    const fn = memoize(async (n: number) => {
      await Promise.resolve();
      if (rejectNext) {
        rejectNext = false;
        throw new Error(`Rejected ${n}`);
      }
      return 0 - n;
    });

    const promises = [42, 42, 888, 888].map((x) => fn(x));

    const results = await Promise.allSettled(promises);

    assert(promises[1] === promises[0]);
    assert(results[1]!.status === "rejected");
    assert(results[1]!.reason.message === "Rejected 42");

    assert(promises[3] === promises[2]);
    assert(results[3]!.status === "fulfilled");
    assert(results[3]!.value === -888);
  },
);

Deno.test("memoize() allows passing a `Map` as a cache", () => {
  let numTimesCalled = 0;
  const cache = new Map();
  const fn = memoize((n: number) => {
    ++numTimesCalled;
    return 0 - n;
  }, { cache });

  assertEquals(fn(42), -42);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(42), -42);
  assertEquals(numTimesCalled, 1);
});

Deno.test("memoize() allows passing a custom cache object", () => {
  let numTimesCalled = 0;

  const uselessCache = {
    has: () => false,
    get: () => {
      throw new Error("`has` is always false, so `get` is never called");
    },
    set: () => {},
    delete: () => {},
    keys: () => [],
  };

  const fn = memoize((n: number) => {
    ++numTimesCalled;
    return 0 - n;
  }, { cache: uselessCache });

  assertEquals(fn(42), -42);
  assertEquals(numTimesCalled, 1);
  assertEquals(fn(42), -42);
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() deletes stale entries of passed `LruCache`", () => {
  let numTimesCalled = 0;

  const MAX_SIZE = 5;

  const fn = memoize((n: number) => {
    ++numTimesCalled;
    return 0 - n;
  }, { cache: new LruCache<string, MemoizationCacheResult<number>>(MAX_SIZE) });

  assertEquals(fn(0), 0);
  assertEquals(fn(0), 0);
  assertEquals(numTimesCalled, 1);

  for (let i = 1; i < MAX_SIZE; ++i) {
    assertEquals(fn(i), 0 - i);
    assertEquals(fn(i), 0 - i);
    assertEquals(numTimesCalled, i + 1);
  }

  assertEquals(fn(MAX_SIZE), 0 - MAX_SIZE);
  assertEquals(fn(MAX_SIZE), 0 - MAX_SIZE);
  assertEquals(numTimesCalled, MAX_SIZE + 1);

  assertEquals(fn(0), 0);
  assertEquals(fn(0), 0);
  assertEquals(numTimesCalled, MAX_SIZE + 2);
});

Deno.test("memoize() only caches single latest result with a `LruCache` of maxSize=1", () => {
  let numTimesCalled = 0;

  const fn = memoize((n: number) => {
    ++numTimesCalled;
    return 0 - n;
  }, { cache: new LruCache<string, MemoizationCacheResult<number>>(1) });

  assertEquals(fn(0), 0);
  assertEquals(fn(0), 0);
  assertEquals(numTimesCalled, 1);

  assertEquals(fn(1), -1);
  assertEquals(numTimesCalled, 2);
});

Deno.test("memoize() preserves function length", () => {
  assertEquals(memoize.length, 2);

  assertEquals(memoize(() => {}).length, 0);
  assertEquals(memoize((_arg) => {}).length, 1);
  assertEquals(memoize((_1, _2) => {}).length, 2);
  assertEquals(memoize((..._args) => {}).length, 0);
  assertEquals(memoize((_1, ..._args) => {}).length, 1);
});

Deno.test("memoize() preserves function name", () => {
  assertEquals(memoize.name, "memoize");

  const fn1 = () => {};
  function fn2() {}
  const obj = { ["!"]: () => {} };

  assertEquals(memoize(() => {}).name, "");
  assertEquals(memoize(fn1).name, "fn1");
  assertEquals(memoize(fn1.bind({})).name, "bound fn1");
  assertEquals(memoize(fn2).name, "fn2");
  assertEquals(memoize(function fn3() {}).name, "fn3");
  assertEquals(memoize(obj["!"]).name, "!");
});

Deno.test("memoize() has correct TS types", async (t) => {
  await t.step("simple types", () => {
    // no need to run, only for type checking
    void (() => {
      const fn: (this: number, x: number) => number = (_) => 1;
      const memoized = memoize(fn);

      const _fn2: typeof fn = memoized;
      const _fn3: Omit<typeof memoized, "cache" | "getKey"> = fn;

      const _t1: ThisParameterType<typeof fn> = 1;
      // @ts-expect-error Type 'string' is not assignable to type 'number'.
      const _t2: ThisParameterType<typeof fn> = "1";

      const _a1: Parameters<typeof fn>[0] = 1;
      // @ts-expect-error Type 'string' is not assignable to type 'number'.
      const _a2: Parameters<typeof fn>[0] = "1";
      // @ts-expect-error Tuple type '[x: number]' of length '1' has no element at index '1'.
      const _a3: Parameters<typeof fn>[1] = {} as never;

      const _r1: ReturnType<typeof fn> = 1;
      // @ts-expect-error Type 'string' is not assignable to type 'number'.
      const _r2: ReturnType<typeof fn> = "1";
    });
  });

  await t.step("memoize() correctly preserves generic types", () => {
    // no need to run, only for type checking
    void (() => {
      const fn = <T>(x: T): T => x;
      const memoized = memoize(fn);

      const _fn2: typeof fn = memoized;
      const _fn3: Omit<typeof memoized, "cache" | "getKey"> = fn;

      const _r1: number = fn(1);
      const _r2: string = fn("1");
      // @ts-expect-error Type 'string' is not assignable to type 'number'.
      const _r3: number = fn("1");

      const _fn4: typeof fn<number> = (n: number) => n;
      // @ts-expect-error Type 'string' is not assignable to type 'number'.
      const _fn5: typeof fn<string> = (n: number) => n;
    });
  });
});

Deno.test("memoize() respects `errorIsCacheable` option", async (t) => {
  type ErrKind = "retriable" | "persistent";

  const errorIsCacheable = (err: unknown) => (err as ErrKind) === "persistent";

  await t.step("default behavior (everything is retriable)", () => {
    let numTimesCalled = 0;

    const throws = memoize((val: ErrKind) => {
      ++numTimesCalled;
      throw val;
    });

    assertThrows(() => throws("retriable"));
    assertEquals(numTimesCalled, 1);

    assertThrows(() => throws("retriable"));
    assertEquals(numTimesCalled, 2);
  });

  await t.step("synchronously thrown errors", () => {
    let numTimesCalled = 0;

    const throws = memoize((val: ErrKind) => {
      ++numTimesCalled;
      throw val;
    }, { errorIsCacheable });

    assertThrows(() => throws("persistent"));
    assertEquals(numTimesCalled, 1);

    assertThrows(() => throws("persistent"));
    assertEquals(numTimesCalled, 1);

    assertThrows(() => throws("retriable"));
    assertEquals(numTimesCalled, 2);

    assertThrows(() => throws("retriable"));
    assertEquals(numTimesCalled, 3);
  });

  await t.step("rejected promises", async () => {
    let numTimesCalled = 0;

    const rejects = memoize(async (val: ErrKind) => {
      await Promise.resolve();
      ++numTimesCalled;
      throw val;
    }, { errorIsCacheable });

    await assertRejects(() => rejects("persistent"));
    assertEquals(numTimesCalled, 1);

    await assertRejects(() => rejects("persistent"));
    assertEquals(numTimesCalled, 1);

    await assertRejects(() => rejects("retriable"));
    assertEquals(numTimesCalled, 2);

    await assertRejects(() => rejects("retriable"));
    assertEquals(numTimesCalled, 3);
  });
});
