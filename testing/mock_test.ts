import { assertEquals, assertNotEquals, assertThrows } from "./asserts.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  MockError,
  mockSession,
  mockSessionAsync,
  restore,
  Spy,
  spy,
  stub,
} from "./mock.ts";
import { Point, stringifyPoint } from "./_test_utils.ts";

Deno.test("spy default", () => {
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
    "function cannot be restore",
  );
  assertEquals(func.restored, false);
});

Deno.test("spy function", () => {
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
    "function cannot be restored",
  );
  assertEquals(func.restored, false);
});

Deno.test("spy instance method", () => {
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
    "instance method already restored",
  );
  assertEquals(func.restored, true);
});

Deno.test("spy instance method symbol", () => {
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
    "instance method already restored",
  );
  assertEquals(func.restored, true);
});

Deno.test("spy instance method property descriptor", () => {
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
    "instance method already restored",
  );
  assertEquals(action.restored, true);
});

Deno.test("stub default", () => {
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
    "instance method already restored",
  );
  assertEquals(func.restored, true);
});

Deno.test("stub function", () => {
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
    "instance method already restored",
  );
  assertEquals(func.restored, true);
});

Deno.test("mockSession and mockSessionAsync", async () => {
  const points = Array(6).fill(undefined).map(() => new Point(2, 3));
  let actions: Spy<Point, unknown[], unknown>[] = [];
  function assertRestored(expected: boolean[]): void {
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

Deno.test("mockSession and restore current session", () => {
  const points = Array(6).fill(undefined).map(() => new Point(2, 3));
  let actions: Spy<Point, unknown[], unknown>[];
  function assertRestored(expected: boolean[]): void {
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

Deno.test("mockSession and restore multiple sessions", () => {
  const points = Array(6).fill(undefined).map(() => new Point(2, 3));
  let actions: Spy<Point, unknown[], unknown>[];
  function assertRestored(expected: boolean[]): void {
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
