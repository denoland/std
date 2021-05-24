// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { afterEach, beforeEach, withHooks } from "./hooks.ts";
import { assert, assertEquals, AssertionError } from "./asserts.ts";

Deno.test("beforeEach is exectued correctly", function (): void {
  let didInvoke = false;
  beforeEach(function () {
    didInvoke = true;
    assertEquals(/deno/, /deno/);
  });
  assertEquals(didInvoke, false);
  withHooks(function () {
    assertEquals(/cat/, /cat/);
  })();
  assertEquals(didInvoke, true);
});

Deno.test("afterEach is exectued correctly", function (): void {
  let didInvoke = false;
  afterEach(function () {
    try {
      assertEquals(/deno/, /cat/);
    } catch (e) {
      assert(e instanceof AssertionError);
      didInvoke = true;
    }
    assertEquals(didInvoke, true);
  });
  assertEquals(didInvoke, false);
  withHooks(function () {
    assertEquals(/cat/, /cat/);
  })();
});
