// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, AssertionError, unreachable } from "./mod.ts";

Deno.test("AssertsUnreachable", function () {
  let didThrow = false;
  try {
    unreachable();
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(e.message === "unreachable");
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("unreachable with reason", function () {
  let didThrow = false;
  try {
    unreachable("inconceivable!");
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(e.message === "inconceivable!");
    didThrow = true;
  }
  assert(didThrow);
});
