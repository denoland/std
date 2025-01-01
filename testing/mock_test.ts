// Copyright 2018-2025 the Deno authors. MIT license.
import { delay } from "@std/async/delay";
import {
  assertEquals,
  AssertionError,
  assertNotEquals,
  assertRejects,
  assertThrows,
} from "@std/assert";
import {
  assertSpyCall,
  assertSpyCallArg,
  assertSpyCallArgs,
  assertSpyCallAsync,
  assertSpyCalls,
  type ExpectedSpyCall,
  type MethodSpy,
  MockError,
  mockSession,
  mockSessionAsync,
  resolvesNext,
  restore,
  returnsArg,
  returnsArgs,
  returnsNext,
  returnsThis,
  type Spy,
  spy,
  type Stub,
  stub,
} from "./mock.ts";
import { Point, type PointWithExtra, stringifyPoint } from "./_test_utils.ts";

Deno.test("spy()", () => {
  const func = spy();
  assertSpyCalls(func, 0);

  assertEquals(func(), undefined);
  assertSpyCall(func, 0, {
    self: undefined,
    args: [],
    returned: undefined,
  });
  assertSpyCalls(func, 1);

  assertEquals(func("x"), undefined);
  assertSpyCall(func, 1, {
    self: undefined,
    args: ["x"],
    returned: undefined,
  });
  assertSpyCalls(func, 2);

  assertEquals(func({ x: 3 }), undefined);
  assertSpyCall(func, 2, {
    self: undefined,
    args: [{ x: 3 }],
    returned: undefined,
  });
  assertSpyCalls(func, 3);

  assertEquals(func(3, 5, 7), undefined);
  assertSpyCall(func, 3, {
    self: undefined,
    args: [3, 5, 7],
    returned: undefined,
  });
  assertSpyCalls(func, 4);

  const point: Point = new Point(2, 3);
  assertEquals(func(Point, stringifyPoint, point), undefined);
  assertSpyCall(func, 4, {
    self: undefined,
    args: [Point, stringifyPoint, point],
    returned: undefined,
  });
  assertSpyCalls(func, 5);

  assertEquals(func.restored, false);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: function cannot be restored",
  );
  assertEquals(func.restored, false);
});

Deno.test("spy() works on function", () => {
  const func = spy((value) => value);
  assertSpyCalls(func, 0);

  assertEquals(func(undefined), undefined);
  assertSpyCall(func, 0, {
    self: undefined,
    args: [undefined],
    returned: undefined,
  });
  assertSpyCalls(func, 1);

  assertEquals(func("x"), "x");
  assertSpyCall(func, 1, {
    self: undefined,
    args: ["x"],
    returned: "x",
  });
  assertSpyCalls(func, 2);

  assertEquals(func({ x: 3 }), { x: 3 });
  assertSpyCall(func, 2, {
    self: undefined,
    args: [{ x: 3 }],
    returned: { x: 3 },
  });
  assertSpyCalls(func, 3);

  const point = new Point(2, 3);
  assertEquals(func(point), point);
  assertSpyCall(func, 3, {
    self: undefined,
    args: [point],
    returned: point,
  });
  assertSpyCalls(func, 4);

  assertEquals(func.restored, false);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: function cannot be restored",
  );
  assertEquals(func.restored, false);

  // Check if the returned type is correct:
  const explicitTypesSpy = spy(point, "explicitTypes");
  assertThrows(() => {
    assertSpyCall(explicitTypesSpy, 0, {
      // @ts-expect-error Test if passing incorrect argument types causes an error
      args: ["not a number", "string"],
      // @ts-expect-error Test if passing incorrect return type causes an error
      returned: "not a boolean",
    });
  });

  // Calling assertSpyCall with the correct types should not cause any type errors:
  point.explicitTypes(1, "hello");
  assertSpyCall(explicitTypesSpy, 0, {
    args: [1, "hello"],
    returned: true,
  });
});

Deno.test("spy() works on instance method", () => {
  const point = new Point(2, 3);
  const func = spy(point, "action");
  assertSpyCalls(func, 0);

  assertEquals(func.call(point), undefined);
  assertSpyCall(func, 0, {
    self: point,
    args: [],
    returned: undefined,
  });
  assertSpyCalls(func, 1);

  assertEquals(point.action(), undefined);
  assertSpyCall(func, 1, { self: point, args: [] });
  assertSpyCalls(func, 2);

  assertEquals(func.call(point, "x"), "x");
  assertSpyCall(func, 2, {
    self: point,
    args: ["x"],
    returned: "x",
  });
  assertSpyCalls(func, 3);

  assertEquals(point.action("x"), "x");
  assertSpyCall(func, 3, {
    self: point,
    args: ["x"],
    returned: "x",
  });
  assertSpyCalls(func, 4);

  assertEquals(func.call(point, { x: 3 }), { x: 3 });
  assertSpyCall(func, 4, {
    self: point,
    args: [{ x: 3 }],
    returned: { x: 3 },
  });
  assertSpyCalls(func, 5);

  assertEquals(point.action({ x: 3 }), { x: 3 });
  assertSpyCall(func, 5, {
    self: point,
    args: [{ x: 3 }],
    returned: { x: 3 },
  });
  assertSpyCalls(func, 6);

  assertEquals(func.call(point, 3, 5, 7), 3);
  assertSpyCall(func, 6, {
    self: point,
    args: [3, 5, 7],
    returned: 3,
  });
  assertSpyCalls(func, 7);

  assertEquals(point.action(3, 5, 7), 3);
  assertSpyCall(func, 7, {
    self: point,
    args: [3, 5, 7],
    returned: 3,
  });
  assertSpyCalls(func, 8);

  assertEquals(func.call(point, Point, stringifyPoint, point), Point);
  assertSpyCall(func, 8, {
    self: point,
    args: [Point, stringifyPoint, point],
    returned: Point,
  });
  assertSpyCalls(func, 9);

  assertEquals(point.action(Point, stringifyPoint, point), Point);
  assertSpyCall(func, 9, {
    self: point,
    args: [Point, stringifyPoint, point],
    returned: Point,
  });
  assertSpyCalls(func, 10);

  assertNotEquals(func, Point.prototype.action);
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

Deno.test("spy() works on instance method symbol", () => {
  const point = new Point(2, 3);
  const func = spy(point, Symbol.iterator);
  assertSpyCalls(func, 0);

  const values: number[] = [];
  for (const value of point) {
    values.push(value);
  }
  assertSpyCall(func, 0, {
    self: point,
    args: [],
  });
  assertSpyCalls(func, 1);

  assertEquals(values, [2, 3]);
  assertEquals([...point], [2, 3]);
  assertSpyCall(func, 1, {
    self: point,
    args: [],
  });
  assertSpyCalls(func, 2);

  assertNotEquals(func, Point.prototype[Symbol.iterator]);
  assertEquals(point[Symbol.iterator], func);

  assertEquals(func.restored, false);
  func.restore();
  assertEquals(func.restored, true);
  assertEquals(point[Symbol.iterator], Point.prototype[Symbol.iterator]);
  assertThrows(
    () => func.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(func.restored, true);
});

Deno.test("spy() works on instance method property descriptor", () => {
  const point = new Point(2, 3);
  const actionDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    writable: false,
    value: function (...args: unknown[]) {
      return args[1];
    },
  };
  Object.defineProperty(point, "action", actionDescriptor);
  const action = spy(point, "action");
  assertSpyCalls(action, 0);

  assertEquals(action.call(point), undefined);
  assertSpyCall(action, 0, {
    self: point,
    args: [],
    returned: undefined,
  });
  assertSpyCalls(action, 1);

  assertEquals(point.action(), undefined);
  assertSpyCall(action, 1, {
    self: point,
    args: [],
    returned: undefined,
  });
  assertSpyCalls(action, 2);

  assertEquals(action.call(point, "x", "y"), "y");
  assertSpyCall(action, 2, {
    self: point,
    args: ["x", "y"],
    returned: "y",
  });
  assertSpyCalls(action, 3);

  assertEquals(point.action("x", "y"), "y");
  assertSpyCall(action, 3, {
    self: point,
    args: ["x", "y"],
    returned: "y",
  });
  assertSpyCalls(action, 4);

  assertNotEquals(action, actionDescriptor.value);
  assertEquals(point.action, action);

  assertEquals(action.restored, false);
  action.restore();
  assertEquals(action.restored, true);
  assertEquals(point.action, actionDescriptor.value);
  assertEquals(
    Object.getOwnPropertyDescriptor(point, "action"),
    actionDescriptor,
  );
  assertThrows(
    () => action.restore(),
    MockError,
    "Cannot restore: instance method already restored",
  );
  assertEquals(action.restored, true);
});

Deno.test("spy() supports explicit resource management", () => {
  const point = new Point(2, 3);
  let funcRef: MethodSpy<Point> | null = null;
  {
    using func = spy(point, "action");
    funcRef = func;
    assertSpyCalls(func, 0);

    assertEquals(func.call(point), undefined);
    assertSpyCall(func, 0, {
      self: point,
      args: [],
      returned: undefined,
    });
    assertSpyCalls(func, 1);

    assertEquals(point.action(), undefined);
    assertSpyCall(func, 1, { self: point, args: [] });
    assertSpyCalls(func, 2);

    assertEquals(func.call(point, "x"), "x");
    assertSpyCall(func, 2, {
      self: point,
      args: ["x"],
      returned: "x",
    });
    assertSpyCalls(func, 3);

    assertEquals(point.action("x"), "x");
    assertSpyCall(func, 3, {
      self: point,
      args: ["x"],
      returned: "x",
    });
    assertSpyCalls(func, 4);

    assertEquals(func.call(point, { x: 3 }), { x: 3 });
    assertSpyCall(func, 4, {
      self: point,
      args: [{ x: 3 }],
      returned: { x: 3 },
    });
    assertSpyCalls(func, 5);

    assertEquals(point.action({ x: 3 }), { x: 3 });
    assertSpyCall(func, 5, {
      self: point,
      args: [{ x: 3 }],
      returned: { x: 3 },
    });
    assertSpyCalls(func, 6);

    assertEquals(func.call(point, 3, 5, 7), 3);
    assertSpyCall(func, 6, {
      self: point,
      args: [3, 5, 7],
      returned: 3,
    });
    assertSpyCalls(func, 7);

    assertEquals(point.action(3, 5, 7), 3);
    assertSpyCall(func, 7, {
      self: point,
      args: [3, 5, 7],
      returned: 3,
    });
    assertSpyCalls(func, 8);

    assertEquals(func.call(point, Point, stringifyPoint, point), Point);
    assertSpyCall(func, 8, {
      self: point,
      args: [Point, stringifyPoint, point],
      returned: Point,
    });
    assertSpyCalls(func, 9);

    assertEquals(point.action(Point, stringifyPoint, point), Point);
    assertSpyCall(func, 9, {
      self: point,
      args: [Point, stringifyPoint, point],
      returned: Point,
    });
    assertSpyCalls(func, 10);

    assertNotEquals(func, Point.prototype.action);
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

Deno.test("spy() works on constructor", () => {
  const PointSpy = spy(Point);
  assertSpyCalls(PointSpy, 0);

  const point = new PointSpy(2, 3);
  assertEquals(point.x, 2);
  assertEquals(point.y, 3);
  assertEquals(point.action(), undefined);

  assertSpyCall(PointSpy, 0, {
    self: undefined,
    args: [2, 3],
    returned: point,
  });
  assertSpyCallArg(PointSpy, 0, 0, 2);
  assertSpyCallArgs(PointSpy, 0, 0, 1, [2]);
  assertSpyCalls(PointSpy, 1);

  new PointSpy(3, 5);
  assertSpyCall(PointSpy, 1, {
    self: undefined,
    args: [3, 5],
  });
  assertSpyCalls(PointSpy, 2);

  assertThrows(
    () => PointSpy.restore(),
    MockError,
    "Cannot restore: constructor cannot be restored",
  );
});

Deno.test("spy() works on constructor of child class", () => {
  const PointSpy = spy(Point);
  const PointSpyChild = class extends PointSpy {
    override action() {
      return 1;
    }
  };
  const point = new PointSpyChild(2, 3);

  assertEquals(point.x, 2);
  assertEquals(point.y, 3);
  assertEquals(point.action(), 1);

  assertSpyCall(PointSpyChild, 0, {
    self: undefined,
    args: [2, 3],
    returned: point,
  });
  assertSpyCalls(PointSpyChild, 1);

  assertSpyCall(PointSpy, 0, {
    self: undefined,
    args: [2, 3],
    returned: point,
  });
  assertSpyCalls(PointSpy, 1);
});

Deno.test("spy() works on constructor that throws an error", () => {
  class Foo {
    constructor() {
      throw new Error("foo");
    }
  }
  const FooSpy = spy(Foo);
  assertThrows(() => new FooSpy(), Error, "foo");
  assertSpyCall(FooSpy, 0, {
    self: undefined,
    args: [],
    error: { Class: Error, msgIncludes: "foo" },
  });
});

Deno.test("spy() works with throwing method", () => {
  const obj = {
    fn() {
      throw new Error("failed");
    },
  };
  const spyFn = spy(obj, "fn");
  assertThrows(() => obj.fn(), Error, "failed");
  assertSpyCall(spyFn, 0, {
    self: obj,
    args: [],
    error: { Class: Error, msgIncludes: "failed" },
  });
});

Deno.test("spy() throws when try spying already spied method", () => {
  const obj = { fn() {} };
  spy(obj, "fn");
  assertThrows(
    () => spy(obj, "fn"),
    MockError,
    "Cannot spy: already spying on instance method",
  );
});

Deno.test("spy() throws when the property is not a method", () => {
  const obj = {};
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => spy(obj as any, "fn"),
    MockError,
    "Cannot spy: property is not an instance method",
  );
});

Deno.test("spy() throws when the property is not configurable", () => {
  const obj = { fn() {} };
  Object.defineProperty(obj, "fn", { configurable: false });
  assertThrows(
    () => spy(obj, "fn"),
    MockError,
    "Cannot spy: non-configurable instance method",
  );
});

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

Deno.test("stub() throws then the property is not configurable", () => {
  const obj = { fn() {} };
  Object.defineProperty(obj, "fn", { configurable: false });
  assertThrows(
    () => stub(obj, "fn"),
    MockError,
    "Cannot stub: non-configurable instance method",
  );
});

Deno.test("mockSession() and mockSessionAsync()", async () => {
  const points = [
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
  ] as const;
  let actions: Spy<Point, unknown[], unknown>[] = [];
  function assertRestored(expected: boolean[]) {
    assertEquals(actions.map((action) => action.restored), expected);
  }
  await mockSessionAsync(async () => {
    actions.push(spy(points[0], "action"));
    assertRestored([false]);
    await mockSessionAsync(async () => {
      await Promise.resolve();
      actions.push(spy(points[1], "action"));
      assertRestored([false, false]);
      mockSession(() => {
        actions.push(spy(points[2], "action"));
        actions.push(spy(points[3], "action"));
        assertRestored([false, false, false, false]);
      })();
      actions.push(spy(points[4], "action"));
      assertRestored([false, false, true, true, false]);
    })();
    actions.push(spy(points[5], "action"));
    assertRestored([false, true, true, true, true, false]);
  })();
  assertRestored(Array(6).fill(true));
  restore();
  assertRestored(Array(6).fill(true));

  actions = [];
  mockSession(() => {
    actions = points.map((point) => spy(point, "action"));
    assertRestored(Array(6).fill(false));
  })();
  assertRestored(Array(6).fill(true));
  restore();
  assertRestored(Array(6).fill(true));
});

Deno.test("mockSession() and restore current session", () => {
  const points = [
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
  ] as const;
  let actions: Spy<Point, unknown[], unknown>[];
  function assertRestored(expected: boolean[]) {
    assertEquals(actions.map((action) => action.restored), expected);
  }
  try {
    actions = points.map((point) => spy(point, "action"));

    assertRestored(Array(6).fill(false));
    restore();
    assertRestored(Array(6).fill(true));
    restore();
    assertRestored(Array(6).fill(true));

    actions = [];
    try {
      actions.push(spy(points[0], "action"));
      try {
        mockSession();
        actions.push(spy(points[1], "action"));
        try {
          mockSession();
          actions.push(spy(points[2], "action"));
          actions.push(spy(points[3], "action"));
        } finally {
          assertRestored([false, false, false, false]);
          restore();
        }
        actions.push(spy(points[4], "action"));
      } finally {
        assertRestored([false, false, true, true, false]);
        restore();
      }
      actions.push(spy(points[5], "action"));
    } finally {
      assertRestored([false, true, true, true, true, false]);
      restore();
    }
    assertRestored(Array(6).fill(true));
    restore();
    assertRestored(Array(6).fill(true));

    actions = points.map((point) => spy(point, "action"));
    assertRestored(Array(6).fill(false));
    restore();
    assertRestored(Array(6).fill(true));
    restore();
    assertRestored(Array(6).fill(true));
  } finally {
    restore();
  }
});

Deno.test("mockSession() and restore multiple sessions", () => {
  const points = [
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
    new Point(2, 3),
  ] as const;
  let actions: Spy<Point, unknown[], unknown>[];
  function assertRestored(expected: boolean[]) {
    assertEquals(actions.map((action) => action.restored), expected);
  }
  try {
    actions = [];
    try {
      actions.push(spy(points[0], "action"));
      const id = mockSession();
      try {
        actions.push(spy(points[1], "action"));
        actions.push(spy(points[2], "action"));
        mockSession();
        actions.push(spy(points[3], "action"));
        actions.push(spy(points[4], "action"));
      } finally {
        assertRestored([false, false, false, false, false]);
        restore(id);
      }
      actions.push(spy(points[5], "action"));
    } finally {
      assertRestored([false, true, true, true, true, false]);
      restore();
    }
    assertRestored(Array(6).fill(true));
    restore();
    assertRestored(Array(6).fill(true));
  } finally {
    restore();
  }
});

Deno.test("assertSpyCalls()", () => {
  const spyFunc = spy();

  assertSpyCalls(spyFunc, 0);
  assertThrows(
    () => assertSpyCalls(spyFunc, 1),
    AssertionError,
    "Spy not called as much as expected",
  );

  spyFunc();
  assertSpyCalls(spyFunc, 1);
  assertThrows(
    () => assertSpyCalls(spyFunc, 0),
    AssertionError,
    "Spy called more than expected",
  );
  assertThrows(
    () => assertSpyCalls(spyFunc, 2),
    AssertionError,
    "Spy not called as much as expected",
  );
});

Deno.test("assertSpyCall() works with function", () => {
  const spyFunc = spy((multiplier?: number) => 5 * (multiplier ?? 1));

  assertThrows(
    () => assertSpyCall(spyFunc, 0),
    AssertionError,
    "Spy not called as much as expected",
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
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "Spy not called as method on expected self",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        returned: 2,
      }),
    AssertionError,
    "Spy call did not return expected value",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        error: { msgIncludes: "x" },
      }),
    AssertionError,
    "Spy call did not throw an error, a value was returned.",
  );
  assertThrows(
    () => assertSpyCall(spyFunc, 1),
    AssertionError,
    "Spy not called as much as expected",
  );
});

Deno.test("assertSpyCall() works with method", () => {
  const point = new Point(2, 3);
  const spyMethod = spy(point, "action");

  assertThrows(
    () => assertSpyCall(spyMethod, 0),
    AssertionError,
    "Spy not called as much as expected",
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
      } as ExpectedSpyCall),
    AssertionError,
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        args: [7, 3],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        self: undefined,
      } as ExpectedSpyCall),
    AssertionError,
    "Spy not expected to be called as method on object",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 0, {
        returned: 7,
      }),
    AssertionError,
    "Spy call did not return expected value",
  );
  assertThrows(
    () => assertSpyCall(spyMethod, 1),
    AssertionError,
    "Spy not called as much as expected",
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
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        args: [7, 3],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        self: new Point(1, 2),
      }),
    AssertionError,
    "Spy not called as method on expected self",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        returned: 7,
      }),
    AssertionError,
    "Spy call did not return expected value",
  );
  assertThrows(
    () =>
      assertSpyCall(spyMethod, 1, {
        error: { msgIncludes: "x" },
      }),
    AssertionError,
    "Spy call did not throw an error, a value was returned.",
  );
  assertThrows(
    () => assertSpyCall(spyMethod, 2),
    AssertionError,
    "Spy not called as much as expected",
  );
});

class ExampleError extends Error {}
class OtherError extends Error {}

Deno.test("assertSpyCall() works with error", () => {
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
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "Spy not called as method on expected self",
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
    "Spy call did not return expected value, an error was thrown.",
  );
  assertThrows(
    () => assertSpyCall(spyFunc, 1),
    AssertionError,
    "Spy not called as much as expected",
  );
});

Deno.test("assertSpyCall() throws TypeError when returned and error are both provided", () => {
  const spyFunc = spy(() => 5);
  spyFunc();

  assertThrows(
    () =>
      assertSpyCall(spyFunc, 0, {
        returned: 5,
        error: { msgIncludes: "x" },
      }),
    TypeError,
    "Do not expect error and return, only one should be expected",
  );
});

Deno.test("assertSpyCallAsync() works with function", async () => {
  const spyFunc = spy((multiplier?: number) =>
    Promise.resolve(5 * (multiplier ?? 1))
  );

  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 0),
    AssertionError,
    "Spy not called as much as expected",
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
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "Spy not called as method on expected self",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: 2,
      }),
    AssertionError,
    "Spy call did not resolve to expected value",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: Promise.resolve(2),
      }),
    AssertionError,
    "Spy call did not resolve to expected value",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 1),
    AssertionError,
    "Spy not called as much as expected",
  );
});

Deno.test("assertSpyCallAsync() works with method", async () => {
  const point: Point = new Point(2, 3);
  const spyMethod = stub(
    point,
    "action",
    (x?: number, _y?: number) => Promise.resolve(x),
  );

  await assertRejects(
    () => assertSpyCallAsync(spyMethod, 0),
    AssertionError,
    "Spy not called as much as expected",
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
      } as ExpectedSpyCall),
    AssertionError,
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        args: [7, 3],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        self: undefined,
      } as ExpectedSpyCall),
    AssertionError,
    "Spy not expected to be called as method on object",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        returned: 7,
      }),
    AssertionError,
    "Spy call did not resolve to expected value",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 0, {
        returned: Promise.resolve(7),
      }),
    AssertionError,
    "Spy call did not resolve to expected value",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyMethod, 1),
    AssertionError,
    "Spy not called as much as expected",
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
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        args: [7, 3],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        self: new Point(1, 2),
      }),
    AssertionError,
    "Spy not called as method on expected self",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        returned: 7,
      }),
    AssertionError,
    "Spy call did not resolve to expected value",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyMethod, 1, {
        returned: Promise.resolve(7),
      }),
    AssertionError,
    "Spy call did not resolve to expected value",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyMethod, 2),
    AssertionError,
    "Spy not called as much as expected",
  );
});

Deno.test("assertSpyCallAsync() rejects on sync value", async () => {
  const spyFunc = spy(() => 4 as unknown as Promise<number>);

  spyFunc();
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 0),
    AssertionError,
    "Spy call did not return a promise, a value was returned.",
  );
});

Deno.test("assertSpyCallAsync() rejects on sync error", async () => {
  const spyFunc = spy(() => {
    throw new ExampleError("failed");
  });

  assertThrows(() => spyFunc(), ExampleError, "fail");
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 0),
    AssertionError,
    "Spy call did not return a promise, an error was thrown.",
  );
});

Deno.test("assertSpyCallAsync() works with error", async () => {
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
  await assertSpyCallAsync(spyFunc, 0, {
    error: {
      msgIncludes: "fail",
    },
  });
  await assertSpyCallAsync(spyFunc, 0, {
    error: {
      Class: Error,
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
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        args: [1],
      }),
    AssertionError,
    "Spy not called with expected args",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        self: {},
      }),
    AssertionError,
    "Spy not called as method on expected self",
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
    "Spy call returned promise was rejected",
  );
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: Promise.resolve(7),
        error: { msgIncludes: "x" },
      }),
    TypeError,
    "Do not expect error and return, only one should be expected",
  );
  await assertRejects(
    () => assertSpyCallAsync(spyFunc, 1),
    AssertionError,
    "Spy not called as much as expected",
  );
});

Deno.test("assertSpyCallAsync() throws type error if expected return value is rejected", async () => {
  const spyFunc = spy(() => Promise.resolve(5));

  spyFunc();
  await assertRejects(
    () =>
      assertSpyCallAsync(spyFunc, 0, {
        returned: Promise.reject(new Error("failed")),
      }),
    TypeError,
    "Do not expect rejected promise, expect error instead",
  );
});

Deno.test("assertSpyCallArg()", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 0, undefined),
    AssertionError,
    "Spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArg(spyFunc, 0, 0, undefined);
  assertSpyCallArg(spyFunc, 0, 1, undefined);
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 0, 2),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


-   undefined
+   2`,
  );

  spyFunc(7, 9);
  assertSpyCallArg(spyFunc, 1, 0, 7);
  assertSpyCallArg(spyFunc, 1, 1, 9);
  assertSpyCallArg(spyFunc, 1, 2, undefined);
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 0, 9),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


-   undefined
+   9`,
  );
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 1, 7),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


-   undefined
+   7`,
  );
  assertThrows(
    () => assertSpyCallArg(spyFunc, 0, 2, 7),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


-   undefined
+   7`,
  );
});

Deno.test("assertSpyCallArgs() throws without range", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, []),
    AssertionError,
    "Spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArgs(spyFunc, 0, []);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, [undefined]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


+   [
+     undefined,
+   ]`,
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, [2]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


+   [
+     2,
+   ]`,
  );

  spyFunc(7, 9);
  assertSpyCallArgs(spyFunc, 1, [7, 9]);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, [7, 9, undefined]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


    [
      7,
      9,
+     undefined,
    ]`,
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, [9, 7]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


    [
-     7,
      9,
+     7,
    ]`,
  );
});

Deno.test("assertSpyCallArgs() throws with start only", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, []),
    AssertionError,
    "Spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArgs(spyFunc, 0, 1, []);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, [undefined]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


+   [
+     undefined,
+   ]`,
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, [2]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


+   [
+     2,
+   ]`,
  );

  spyFunc(7, 9, 8);
  assertSpyCallArgs(spyFunc, 1, 1, [9, 8]);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, [9, 8, undefined]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


    [
      9,
      8,
+     undefined,
    ]`,
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, [9, 7]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


    [
      9,
-     8,
+     7,
    ]`,
  );
});

Deno.test("assertSpyCallArgs() throws with range", () => {
  const spyFunc = spy();

  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, 3, []),
    AssertionError,
    "Spy not called as much as expected",
  );

  spyFunc();
  assertSpyCallArgs(spyFunc, 0, 1, 3, []);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, 3, [undefined, undefined]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


+   [
+     undefined,
+     undefined,
+   ]`,
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 0, 1, 3, [2, 4]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


+   [
+     2,
+     4,
+   ]`,
  );

  spyFunc(7, 9, 8, 5, 6);
  assertSpyCallArgs(spyFunc, 1, 1, 3, [9, 8]);
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, 3, [9, 8, undefined]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


    [
      9,
      8,
+     undefined,
    ]`,
  );
  assertThrows(
    () => assertSpyCallArgs(spyFunc, 1, 1, 3, [9, 7]),
    AssertionError,
    `Values are not equal.


    [Diff] Actual / Expected


    [
      9,
-     8,
+     7,
    ]`,
  );
});

Deno.test("returnsThis()", () => {
  const callback = returnsThis();
  const obj = { callback, x: 1, y: 2 };
  const obj2 = { x: 2, y: 3 };
  assertEquals(callback(), undefined);
  assertEquals(obj.callback(), obj);
  assertEquals(callback.apply(obj2, []), obj2);
});

Deno.test("returnsArg()", () => {
  let callback = returnsArg(0);
  assertEquals(callback(), undefined);
  assertEquals(callback("a"), "a");
  assertEquals(callback("b", "c"), "b");
  callback = returnsArg(1);
  assertEquals(callback(), undefined);
  assertEquals(callback("a"), undefined);
  assertEquals(callback("b", "c"), "c");
  assertEquals(callback("d", "e", "f"), "e");
});

Deno.test("returnsArgs()", () => {
  let callback = returnsArgs();
  assertEquals(callback(), []);
  assertEquals(callback("a"), ["a"]);
  assertEquals(callback("b", "c"), ["b", "c"]);
  callback = returnsArgs(1);
  assertEquals(callback(), []);
  assertEquals(callback("a"), []);
  assertEquals(callback("b", "c"), ["c"]);
  assertEquals(callback("d", "e", "f"), ["e", "f"]);
  callback = returnsArgs(1, 3);
  assertEquals(callback("a"), []);
  assertEquals(callback("b", "c"), ["c"]);
  assertEquals(callback("d", "e", "f"), ["e", "f"]);
  assertEquals(callback("d", "e", "f", "g"), ["e", "f"]);
});

Deno.test("returnsNext() works with array", () => {
  let results = [1, 2, new Error("oops"), 3];
  let callback = returnsNext(results);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 4 time(s)",
  );
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 4 time(s)",
  );

  results = [];
  callback = returnsNext(results);
  results.push(1, 2, new Error("oops"), 3);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  results.push(4);
  assertEquals(callback(), 4);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
  results.push(5);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
});

Deno.test("returnsNext() works with iterator", () => {
  let results = [1, 2, new Error("oops"), 3];
  let callback = returnsNext(results.values());
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 4 time(s)",
  );
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 4 time(s)",
  );

  results = [];
  callback = returnsNext(results.values());
  results.push(1, 2, new Error("oops"), 3);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  results.push(4);
  assertEquals(callback(), 4);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
  results.push(5);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
});

Deno.test("returnsNext() works with generator", () => {
  let results = [1, 2, new Error("oops"), 3];
  const generator = function* () {
    yield* results;
  };
  let callback = returnsNext(generator());
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 4 time(s)",
  );
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 4 time(s)",
  );

  results = [];
  callback = returnsNext(generator());
  results.push(1, 2, new Error("oops"), 3);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  results.push(4);
  assertEquals(callback(), 4);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
  results.push(5);
  assertThrows(
    () => callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
});

Deno.test("resolvesNext() works with array", async () => {
  let results = [
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  ];
  let callback = resolvesNext(results);
  const value = callback();
  assertEquals(Promise.resolve(value), value);
  assertEquals(await value, 1);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );

  results = [];
  callback = resolvesNext(results);
  results.push(
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  );
  assertEquals(await callback(), 1);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  results.push(4);
  assertEquals(await callback(), 4);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 6 time(s)",
  );
  results.push(5);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 6 time(s)",
  );
});

Deno.test("resolvesNext() works with iterator", async () => {
  let results = [
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  ];
  let callback = resolvesNext(results.values());
  const value = callback();
  assertEquals(Promise.resolve(value), value);
  assertEquals(await value, 1);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );

  results = [];
  callback = resolvesNext(results.values());
  results.push(
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  );
  assertEquals(await callback(), 1);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  results.push(4);
  assertEquals(await callback(), 4);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 6 time(s)",
  );
  results.push(5);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 6 time(s)",
  );
});

Deno.test("resolvesNext() works with async generator", async () => {
  let results = [
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  ];
  const asyncGenerator = async function* () {
    await delay(0);
    yield* results;
  };
  let callback = resolvesNext(asyncGenerator());
  const value = callback();
  assertEquals(Promise.resolve(value), value);
  assertEquals(await value, 1);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 5 time(s)",
  );

  results = [];
  callback = resolvesNext(asyncGenerator());
  results.push(
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  );
  assertEquals(await callback(), 1);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  await assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  results.push(4);
  assertEquals(await callback(), 4);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 6 time(s)",
  );
  results.push(5);
  await assertRejects(
    async () => await callback(),
    MockError,
    "Not expected to be called more than 6 time(s)",
  );
});
