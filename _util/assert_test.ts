// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  assertStringIncludes,
  DenoStdInternalError,
  fail,
  unreachable,
} from "./asserts.ts";
import { assertThrows } from "../testing/asserts.ts";

Deno.test({
  name: "assert valid scenario",
  fn() {
    assert(true);
  },
});

Deno.test({
  name: "assert invalid scenario, no message",
  fn() {
    assertThrows(() => {
      assert(false);
    }, DenoStdInternalError);
  },
});

Deno.test({
  name: "assert invalid scenario, with message",
  fn() {
    assertThrows(
      () => {
        assert(false, "Oops! Should be true");
      },
      DenoStdInternalError,
      "Oops! Should be true",
    );
  },
});

Deno.test(
  "assertEquals compares objects structurally if one object's constructor is undefined and the other is Object",
  () => {
    const a = Object.create(null);
    a.prop = "test";
    const b = {
      prop: "test",
    };

    assertEquals(a, b);
    assertEquals(b, a);
  },
);

Deno.test(
  "assertEquals compares objects structurally if one object's constructor is undefined and the other is Object",
  () => {
    const a = Object.create(null);
    a.prop = "test";
    const b = {
      prop: "test",
    };

    assertEquals(a, b);
    assertEquals(b, a);
  },
);

Deno.test("assertEquals diff for differently ordered objects", () => {
  assertThrows(
    () => {
      assertEquals(
        {
          aaaaaaaaaaaaaaaaaaaaaaaa: 0,
          bbbbbbbbbbbbbbbbbbbbbbbb: 0,
          ccccccccccccccccccccccc: 0,
        },
        {
          ccccccccccccccccccccccc: 1,
          aaaaaaaaaaaaaaaaaaaaaaaa: 0,
          bbbbbbbbbbbbbbbbbbbbbbbb: 0,
        },
      );
    },
    DenoStdInternalError,
    `
    {
      aaaaaaaaaaaaaaaaaaaaaaaa: 0,
      bbbbbbbbbbbbbbbbbbbbbbbb: 0,
-     ccccccccccccccccccccccc: 0,
+     ccccccccccccccccccccccc: 1,
    }`,
  );
});

Deno.test("AssertStringIncludes", function () {
  assertStringIncludes("Denosaurus", "saur");
  assertStringIncludes("Denosaurus", "Deno");
  assertStringIncludes("Denosaurus", "rus");
  let didThrow;
  try {
    assertStringIncludes("Denosaurus", "Raptor");
    didThrow = false;
  } catch (e) {
    assert(e instanceof DenoStdInternalError);
    didThrow = true;
  }
  assertEquals(didThrow, true);
});

Deno.test("AssertStringContainsThrow", function () {
  let didThrow = false;
  try {
    assertStringIncludes("Denosaurus from Jurassic", "Raptor");
  } catch (e) {
    assert(e instanceof DenoStdInternalError);
    assert(
      e.message ===
        `actual: "Denosaurus from Jurassic" expected to contain: "Raptor"`,
    );
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("AssertFail", function () {
  assertThrows(fail, DenoStdInternalError, "Failed assertion.");
  assertThrows(
    () => {
      fail("foo");
    },
    DenoStdInternalError,
    "Failed assertion: foo",
  );
});

Deno.test("AssertsUnreachable", function () {
  let didThrow = false;
  try {
    unreachable();
  } catch (e) {
    assert(e instanceof DenoStdInternalError);
    assert(e.message === "unreachable");
    didThrow = true;
  }
  assert(didThrow);
});
