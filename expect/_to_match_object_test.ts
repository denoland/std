// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import {
  AssertionError,
  assertMatch,
  assertNotMatch,
  assertThrows,
} from "@std/assert";

Deno.test("expect().toMatchObject()", () => {
  const house0 = {
    bath: true,
    bedrooms: 4,
    kitchen: {
      amenities: ["oven", "stove", "washer"],
      area: 20,
      wallColor: "white",
    },
  };
  const house1 = {
    bath: true,
    bedrooms: 4,
    kitchen: {
      amenities: ["oven", "stove"],
      area: 20,
      wallColor: "white",
    },
  };
  const desiredHouse = {
    bath: true,
    kitchen: {
      amenities: ["oven", "stove", "washer"],
      wallColor: "white",
    },
  };

  expect(house0).toMatchObject(desiredHouse);
  expect([house0]).toMatchObject([desiredHouse]);

  expect(house1).not.toMatchObject(desiredHouse);
  expect([house1]).not.toMatchObject([desiredHouse]);

  assertThrows(() => {
    expect(house1).toMatchObject(desiredHouse);
  }, AssertionError);
  assertThrows(() => {
    expect([house1]).toMatchObject([desiredHouse]);
  }, AssertionError);

  assertThrows(() => {
    expect(house0).not.toMatchObject(desiredHouse);
  }, AssertionError);
  assertThrows(() => {
    expect([house0]).not.toMatchObject([desiredHouse]);
  }, AssertionError);
});

Deno.test("expect().toMatchObject() with array", () => {
  const fixedPriorityQueue = Array.from({ length: 5 });
  fixedPriorityQueue[0] = { data: 1, priority: 0 };

  expect(fixedPriorityQueue).toMatchObject([
    { data: 1, priority: 0 },
  ]);
});

Deno.test("expect().toMatchObject() with asymmetric matcher", () => {
  expect({ position: { x: 0, y: 0 } }).toMatchObject({
    position: {
      x: expect.any(Number),
      y: expect.any(Number),
    },
  });
});

Deno.test("expect().toMatchObject() with custom error message", () => {
  const house0 = {
    bath: true,
    bedrooms: 4,
    kitchen: {
      amenities: ["oven", "stove", "washer"],
      area: 20,
      wallColor: "white",
    },
  };
  const house1 = {
    bath: true,
    bedrooms: 4,
    kitchen: {
      amenities: ["oven", "stove"],
      area: 20,
      wallColor: "white",
    },
  };
  const desiredHouse = {
    bath: true,
    kitchen: {
      amenities: ["oven", "stove", "washer"],
      wallColor: "white",
    },
  };
  const msg = "toMatchObject Custom Error";

  expect(() => expect([house1], msg).toMatchObject([desiredHouse])).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(house0, msg).not.toMatchObject(desiredHouse)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(null, msg).toMatchObject([desiredHouse])).toThrow(
    new RegExp(`^${msg}`),
  );
});

Deno.test("expect().toMatchObject() throws the correct error messages", () => {
  {
    const e = assertThrows(
      () => expect({ a: 1 }).toMatchObject({ a: 2 }),
      AssertionError,
    );
    assertNotMatch(e.message, /not to be/);
  }
  {
    const e = assertThrows(
      () => expect({ a: 1 }).not.toMatchObject({ a: 1 }),
      AssertionError,
    );
    assertMatch(e.message, /not to be/);
  }
});

Deno.test("expect().toMatchObject() displays a diff", async (t) => {
  await t.step("with expect.any", () => {
    assertThrows(
      () =>
        expect({ a: "a" })
          .toMatchObject({ a: expect.any(Number) }),
      AssertionError,
      `    {
+     a: Any {
+       inverse: false,
+       value: [Function: Number],
+     },
-     a: "a",
    }`,
    );
  });

  await t.step("with nested properties", () => {
    const x = {
      command: "error",
      payload: {
        message: "NodeNotFound",
      },
      protocol: "graph",
    };

    const y = {
      protocol: "graph",
      command: "addgroup",
      payload: {
        graph: "foo",
        metadata: {
          description: "foo",
        },
        name: "somegroup",
        nodes: [
          "somenode",
          "someothernode",
        ],
      },
    };

    assertThrows(
      () => expect(x).toMatchObject(y),
      AssertionError,
      `    {
+     command: "addgroup",
-     command: "error",
      payload: {
+       graph: "foo",
+       metadata: {
+         description: "foo",
+       },
+       name: "somegroup",
+       nodes: [
+         "somenode",
+         "someothernode",
+       ],
-       message: "NodeNotFound",
      },
      protocol: "graph",
    }`,
    );

    assertThrows(
      () => expect({ foo: [] }).toMatchObject({ foo: ["bar"] }),
      AssertionError,
      `    {
+     foo: [
+       "bar",
+     ],
-     foo: [],
    }`,
    );
  });

  await t.step(
    "with `__proto__`",
    () => {
      const objectA = { ["__proto__"]: { polluted: true } };
      const objectB = { ["__proto__"]: { polluted: true } };
      const objectC = { ["__proto__"]: { polluted: false } };
      expect(objectA).toMatchObject(objectB);
      assertThrows(
        () => expect(objectA).toMatchObject(objectC),
        AssertionError,
        `    {
      ['__proto__']: {
-       polluted: true,
+       polluted: false,
      },
    }`,
      );
    },
  );
});
