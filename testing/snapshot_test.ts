// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { stripColor } from "../fmt/colors.ts";
import { assertInstanceOf, AssertionError, fail } from "./asserts.ts";
import { assertSnapshot } from "./snapshot.ts";

class TestClass {
  a = 1;
  b = 2;
  init() {
    this.b = 3;
  }
  get getA() {
    return this.a;
  }
  func() {}
}

const map = new Map();
map.set("Hello", "World!");
map.set(() => "Hello", "World!");
map.set(1, 2);

Deno.test("Snapshot Test", async (t) => {
  await assertSnapshot(t, { a: 1, b: 2 });
  await assertSnapshot(t, new TestClass());
  await assertSnapshot(t, map);
  await assertSnapshot(t, new Set([1, 2, 3]));
  await assertSnapshot(t, { fn() {} });
  await assertSnapshot(t, function fn() {});
  await assertSnapshot(t, [1, 2, 3]);
  await assertSnapshot(t, "hello world");
});

Deno.test("Snapshot Test - step", async (t) => {
  await assertSnapshot(t, { a: 1, b: 2 });
  await t.step("Nested", async (t) => {
    await assertSnapshot(t, new TestClass());
    await assertSnapshot(t, map);
    await t.step("Nested Nested", async (t) => {
      await assertSnapshot(t, new Set([1, 2, 3]));
      await assertSnapshot(t, { fn() {} });
      await assertSnapshot(t, function fn() {});
    });
    await assertSnapshot(t, [1, 2, 3]);
  });
  await assertSnapshot(t, "hello world");
});

Deno.test("Snapshot Test - Adverse String \\ ` ${}", async (t) => {
  await assertSnapshot(t, "\\ ` ${}");
});

Deno.test("Snapshot Test - Failed Assertion", async (t) => {
  await t.step("Object", async (t) => {
    try {
      await assertSnapshot(t, [1, 2]);
      fail("Expected snapshot not to match");
    } catch (error) {
      assertInstanceOf(error, AssertionError);
      await assertSnapshot(t, stripColor(error.message).split("\n"));
    }
  });
  await t.step("String", async (t) => {
    try {
      await assertSnapshot(t, "Hello!");
      fail("Expected snapshot not to match");
    } catch (error) {
      assertInstanceOf(error, AssertionError);
      await assertSnapshot(t, stripColor(error.message).split("\n"));
    }
  });
});
