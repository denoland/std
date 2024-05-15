// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "@std/assert";
import { _serializeArgList } from "./memoize.ts";
import { delay } from "@std/async";

Deno.test("_serializeArgList() serializes simple numbers", () => {
  const getKey = _serializeArgList(new Map());
  assertEquals(getKey(1), "undefined,1");
  assertEquals(getKey(1, 2), "undefined,1,2");
  assertEquals(getKey(1, 2, 3), "undefined,1,2,3");
});

Deno.test("_serializeArgList() serializes primitive types", () => {
  const getKey = _serializeArgList(new Map());
  assertEquals(
    getKey(
      1,
      "2",
      3n,
      null,
      undefined,
      true,
      Symbol.for("xyz"),
      NaN,
      Infinity,
      -Infinity,
      0,
      -0,
    ),
    'undefined,1,"2",3n,null,undefined,true,Symbol.for("xyz"),NaN,Infinity,-Infinity,0,0',
  );
});

Deno.test("_serializeArgList() implements SameValueZero algorithm", async (t) => {
  // https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero

  const getKey = _serializeArgList(new Map());

  await t.step("1. If Type(x) is not Type(y), return false.", () => {
    assert(getKey(1) !== getKey("1"));
    assert(getKey(1) !== getKey(1n));
    assert(getKey("true") !== getKey(true));
    assert(getKey(null) !== getKey(undefined));
  });

  await t.step(
    "2. If x is a Number, then return Number::sameValueZero(x, y).",
    async (t) => {
      // https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-sameValueZero
      await t.step("1. If x is NaN and y is NaN, return true.", () => {
        assert(getKey(NaN) === getKey(NaN));
      });
      await t.step("2. If x is +0𝔽 and y is -0𝔽, return true.", () => {
        assert(getKey(0) === getKey(-0));
      });
      await t.step("3. If x is -0𝔽 and y is +0𝔽, return true.", () => {
        assert(getKey(-0) === getKey(0));
      });
      await t.step("4. If x is y, return true.", () => {
        assert(getKey(42) === getKey(42));
      });
      await t.step("5. Return false.", () => {
        assert(getKey(42) !== getKey(43));
      });
    },
  );

  await t.step("3. Return SameValueNonNumber(x, y).", async (t) => {
    // https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluenonnumber

    // 1. Assert: Type(x) is Type(y).

    await t.step("2. If x is either null or undefined, return true.", () => {
      assert(getKey(null) === getKey(null));
      assert(getKey(undefined) === getKey(undefined));
    });
    await t.step(
      "3. If x is a BigInt, then return BigInt::equal(x, y).",
      () => {
        assert(getKey(42n) === getKey(42n));
        assert(getKey(42n) !== getKey(43n));
      },
    );

    await t.step(
      "4. If x is a String, then if x and y have the same length and the same code units in the same positions, return true; otherwise, return false.",
      () => {
        assert(getKey("a") === getKey("a"));
        assert(getKey("a") !== getKey("aa"));
      },
    );

    await t.step(
      "5. If x is a Boolean, then if x and y are both true or both false, return true; otherwise, return false.",
      () => {
        assert(getKey(true) === getKey(true));
        assert(getKey(false) === getKey(false));
        assert(getKey(true) !== getKey(false));
      },
    );

    // 6. NOTE: All other ECMAScript language values are compared by identity.

    await t.step("7. If x is y, return true; otherwise, return false.", () => {
      const obj1 = {};
      const obj2 = {};
      assert(getKey(obj1) === getKey(obj1));
      assert(getKey(obj1) !== getKey(obj2));
    });
  });
});

Deno.test("_serializeArgList() serializes reference types", () => {
  const getKey = _serializeArgList(new Map());
  const obj = {};
  const arr: [] = [];
  const sym = Symbol("xyz");

  assertEquals(getKey(obj), "undefined,{0}");
  assertEquals(getKey(obj, obj), "undefined,{0},{0}");

  assertEquals(getKey(arr), "undefined,{1}");
  assertEquals(getKey(sym), "undefined,{2}");
  assertEquals(
    getKey(obj, arr, sym),
    "undefined,{0},{1},{2}",
  );
});

Deno.test("_serializeArgList() discriminates on `this` arg", () => {
  const getKey = _serializeArgList(new Map());
  const obj1 = {};
  const obj2 = {};

  assertEquals(getKey(), "undefined");
  assertEquals(getKey.call(obj1), "{0}");
  assertEquals(getKey.call(obj2), "{1}");
  assertEquals(getKey.call(obj1, obj2), "{0},{1}");
});

Deno.test("_serializeArgList() allows garbage collection for weak keys", async () => {
  // @ts-expect-error - Triggering true garbage collection is only available
  // with `--v8-flags="--expose-gc"`, so we mock `FinalizationRegistry` with
  // `using` and some `Symbol.dispose` trickery if it's not available. Run this
  // test with `deno test --v8-flags="--expose-gc"` to test actual gc behavior
  // (however, even calling `globalThis.gc` doesn't _guarantee_ garbage
  // collection, so this may be flaky between v8 versions etc.)
  const gc = globalThis.gc as undefined | (() => void);

  class MockFinalizationRegistry<T> extends FinalizationRegistry<T> {
    #cleanupCallback: (heldValue: T) => void;

    constructor(cleanupCallback: (heldValue: T) => void) {
      super(cleanupCallback);
      this.#cleanupCallback = cleanupCallback;
    }

    override register(target: WeakKey, heldValue: T) {
      Object.assign(target, {
        onCleanup: () => {
          this.#cleanupCallback(heldValue);
        },
      });
    }
  }

  function makeRegisterableObject() {
    const onCleanup = null as (() => void) | null;
    return {
      onCleanup,
      [Symbol.dispose]() {
        this.onCleanup?.();
      },
    };
  }

  const OriginalFinalizationRegistry = FinalizationRegistry;

  try {
    if (!gc) {
      globalThis.FinalizationRegistry = MockFinalizationRegistry;
    }

    const cache = new Map();
    const getKey = _serializeArgList(cache);

    using outerScopeObj = makeRegisterableObject();

    const k1 = getKey(outerScopeObj);
    const k2 = getKey(globalThis);
    const k3 = getKey("primitive");
    const k4 = getKey(globalThis, "primitive");
    const k5 = getKey(globalThis, "primitive", outerScopeObj);

    const persistentKeys = new Set([k1, k2, k3, k4, k5]);

    await (async () => {
      using obj1 = makeRegisterableObject();
      using obj2 = makeRegisterableObject();

      const k6 = getKey(obj1);
      const k7 = getKey(obj2);
      const k8 = getKey(obj1, obj2);
      const k9 = getKey(obj1, globalThis);
      const k10 = getKey(obj1, "primitive");
      const k11 = getKey(obj1, outerScopeObj);

      const ephemeralKeys = new Set([k6, k7, k8, k9, k10, k11]);

      const keys = new Set([...ephemeralKeys, ...persistentKeys]);
      for (const [idx, key] of [...keys].entries()) {
        cache.set(key, idx + 1);
      }

      gc?.();
      // wait for gc to run
      await delay(0);
      assertEquals(cache.size, keys.size);
    })();

    gc?.();
    // wait for gc to run
    await delay(0);
    assertEquals(cache.size, persistentKeys.size);
  } finally {
    globalThis.FinalizationRegistry = OriginalFinalizationRegistry;
  }
});
