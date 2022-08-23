// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assert, DenoStdInternalError } from "./assert.ts";
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
