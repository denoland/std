// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, DenoStdInternalError, unreachable } from "./asserts.ts";
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

Deno.test("assert unreachable", function () {
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
