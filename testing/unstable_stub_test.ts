// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import {
  assertSpyCall,
  assertSpyCallArg,
  assertSpyCalls,
  MockError,
  returnsNext,
} from "./mock.ts";
import { Point, type PointWithExtra } from "./_test_utils.ts";
import { type Stub, stub } from "./unstable_stub.ts";

Deno.test("stub()", () => {
  const point = new Point(2, 3);
  const func = stub(point, "action");

  assertSpyCalls(func, 0);

  assertEquals(func.call(point), undefined);
  assertSpyCall(func, 0, {
    self: point,
    args: [],
    returned: undefined,
  });
  assertSpyCalls(func, 1);

  assertEquals(point.action(), undefined);
  assertSpyCall(func, 1, {
    self: point,
    args: [],
    returned: undefined,
  });
  assertSpyCalls(func, 2);

  assertEquals(func.original, Point.prototype.action);
  assertEquals(point.action, func);

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertEquals(point.action, Point.prototype.action);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(func.restored, true);
});

Deno.test("stub() works on function", () => {
  const point = new Point(2, 3);
  const returns = [1, "b", 2, "d"];
  const func = stub(point, "action", () => returns.shift());

  assertSpyCalls(func, 0);

  assertEquals(func.call(point), 1);
  assertSpyCall(func, 0, {
    self: point,
    args: [],
    returned: 1,
  });
  assertSpyCalls(func, 1);

  assertEquals(point.action(), "b");
  assertSpyCall(func, 1, {
    self: point,
    args: [],
    returned: "b",
  });
  assertSpyCalls(func, 2);

  assertEquals(func.original, Point.prototype.action);
  assertEquals(point.action, func);

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertEquals(point.action, Point.prototype.action);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(func.restored, true);
});
Deno.test("stub() works on getter", () => {
  const point = new Point(5, 6);
  const returns = [1, 2, 3, 4];
  const func = stub(point, "x", {
    get: function () {
      return returns.shift();
    },
  });

  assertSpyCalls(func.get, 0);

  assertEquals(point.x, 1);
  assertSpyCall(func.get, 0, {
    self: point,
    args: [],
    returned: 1,
  });
  assertSpyCalls(func.get, 1);

  assertEquals(point.x, 2);
  assertSpyCall(func.get, 1, {
    self: point,
    args: [],
    returned: 2,
  });
  assertSpyCalls(func.get, 2);

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertEquals(point.x, 5);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(func.restored, true);
});
Deno.test("stub() works on setter", () => {
  const point = new Point(5, 6);
  const func = stub(point, "x", {
    set: function (value: number) {
      point.y = value;
    },
  });

  assertSpyCalls(func.set, 0);
  assertEquals(point.y, 6);

  point.x = 10;

  assertEquals(point.y, 10);
  assertSpyCalls(func.set, 1);
  assertSpyCallArg(func.set, 0, 0, 10);

  point.x = 15;

  assertEquals(point.y, 15);
  assertSpyCalls(func.set, 2);
  assertSpyCallArg(func.set, 1, 0, 15);

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(func.restored, true);
});
Deno.test("stub() works on getter and setter", () => {
  const point = new Point(5, 6);
  const returns = [1, 2, 3, 4];
  const func = stub(point, "x", {
    get: function () {
      return returns.shift();
    },
    set: function (value: number) {
      point.y = value;
    },
  });

  assertSpyCalls(func.set, 0);
  assertSpyCalls(func.get, 0);
  assertEquals(point.y, 6);
  assertEquals(point.x, 1);

  point.x = 10;

  assertEquals(point.y, 10);
  assertSpyCalls(func.set, 1);
  assertSpyCalls(func.get, 1);
  assertSpyCallArg(func.set, 0, 0, 10);
  assertSpyCall(func.get, 0, {
    self: point,
    args: [],
    returned: 1,
  });

  point.x = 15;

  assertEquals(point.x, 2);
  assertEquals(point.y, 15);
  assertSpyCalls(func.set, 2);
  assertSpyCalls(func.get, 2);
  assertSpyCallArg(func.set, 1, 0, 15);
  assertSpyCall(func.get, 1, {
    self: point,
    args: [],
    returned: 2,
  });

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(point.x, 5);
  assertEquals(func.restored, true);
});
Deno.test("stub() supports explicit resource management", () => {
  const point = new Point(2, 3);
  const returns = [1, "b", 2, "d"];
  let funcRef: Stub<Point> | null = null;
  {
    using func = stub(point, "action", () => returns.shift());
    funcRef = func;

    assertSpyCalls(func, 0);

    assertEquals(func.call(point), 1);
    assertSpyCall(func, 0, {
      self: point,
      args: [],
      returned: 1,
    });
    assertSpyCalls(func, 1);

    assertEquals(point.action(), "b");
    assertSpyCall(func, 1, {
      self: point,
      args: [],
      returned: "b",
    });
    assertSpyCalls(func, 2);

    assertEquals(func.original, Point.prototype.action);
    assertEquals(point.action, func);

    assertEquals(func.restored, false);
  }
  if (funcRef) {
    assertEquals(funcRef.restored, true);
    assertEquals(point.action, Point.prototype.action);
    assertThrows(
      () => {
        if (funcRef) funcRef.restore();
      },
      MockError,
      "Cannot restore: instance method already restored",
    );
    assertEquals(funcRef.restored, true);
  }
});
Deno.test("stub() handles non existent function", () => {
  const point = new Point(2, 3);
  const castPoint = point as PointWithExtra;
  let i = 0;
  const func = stub(castPoint, "nonExistent", () => {
    i++;
    return i;
  });

  assertSpyCalls(func, 0);

  assertEquals(func.call(castPoint), 1);
  assertSpyCall(func, 0, {
    self: castPoint,
    args: [],
    returned: 1,
  });
  assertSpyCalls(func, 1);

  assertEquals(castPoint.nonExistent(), 2);
  assertSpyCall(func, 1, {
    self: castPoint,
    args: [],
    returned: 2,
  });
  assertSpyCalls(func, 2);

  assertEquals(func.original, undefined);
  assertEquals(castPoint.nonExistent, func);

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertEquals(castPoint.nonExistent, undefined);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(func.restored, true);
});

// This doesn't test any runtime code, only if the TypeScript types are correct.
Deno.test("stub() correctly handles types", () => {
  // @ts-expect-error Stubbing with incorrect argument types should cause a type error
  stub(new Point(2, 3), "explicitTypes", (_x: string, _y: number) => true);

  // @ts-expect-error Stubbing with an incorrect return type should cause a type error
  stub(new Point(2, 3), "explicitTypes", () => "string");

  // Stubbing without argument types infers them from the real function
  stub(new Point(2, 3), "explicitTypes", (_x, _y) => {
    // `toExponential()` only exists on `number`, so this will error if _x is not a number
    _x.toExponential();
    // `toLowerCase()` only exists on `string`, so this will error if _y is not a string
    _y.toLowerCase();
    return true;
  });

  // Stubbing with returnsNext() should not give any type errors
  stub(new Point(2, 3), "explicitTypes", returnsNext([true, false, true]));

  // Stubbing without argument types should not cause any type errors:
  const point2 = new Point(2, 3);
  const explicitTypesFunc = stub(point2, "explicitTypes", () => true);

  // Check if the returned type is correct:
  assertThrows(() => {
    assertSpyCall(explicitTypesFunc, 0, {
      // @ts-expect-error Test if passing incorrect argument types causes an error
      args: ["not a number", "string"],
      // @ts-expect-error Test if passing incorrect return type causes an error
      returned: "not a boolean",
    });
  });

  // Calling assertSpyCall with the correct types should not cause any type errors
  point2.explicitTypes(1, "hello");
  assertSpyCall(explicitTypesFunc, 0, {
    args: [1, "hello"],
    returned: true,
  });
});

Deno.test("stub() works with throwing fake implementation", () => {
  const obj = {
    fn() {
      throw new Error("failed");
    },
  };
  const stubFn = stub(obj, "fn", () => {
    throw new Error("failed");
  });
  assertThrows(() => obj.fn(), Error, "failed");
  assertSpyCall(stubFn, 0, {
    self: obj,
    args: [],
    error: { Class: Error, msgIncludes: "failed" },
  });
});

Deno.test("stub() throws when the property is not a method", () => {
  const obj = { fn: 1 };
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => stub(obj as any, "fn"),
    MockError,
    "Cannot stub: property is not an instance method",
  );
});

Deno.test("stub() throws when try stubbing already stubbed method", () => {
  const obj = { fn() {} };
  stub(obj, "fn");
  assertThrows(
    () => stub(obj, "fn"),
    MockError,
    "Cannot stub: already spying on instance method",
  );
});

Deno.test("stub() throws when neither setter not getter is defined", () => {
  const obj = { prop: "foo" };

  assertThrows(
    () => stub(obj, "prop", {}),
    MockError,
    "Cannot stub: neither setter nor getter is defined",
  );
});

Deno.test("stub() throws then the property is not configurable", () => {
  const obj = { fn() {} };
  Object.defineProperty(obj, "fn", { configurable: false });
  assertThrows(
    () => stub(obj, "fn"),
    MockError,
    "Cannot stub: non-configurable instance method",
  );
});
