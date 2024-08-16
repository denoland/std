// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertNever, assertThrows } from "./mod.ts";

Deno.test("assertNever: exhaustiveness check", () => {
  type Kinds = "A" | "B";

  function doA() {
    // ...
  }

  function doB() {
    // ...
  }

  function handleKind(kind: Kinds) {
    switch (kind) {
      case "A":
        doA();
        break;
      case "B":
        doB();
        break;
      default:
        assertNever(kind);
    }
  }

  handleKind("A");
  handleKind("B");
});

Deno.test("assertNever throws AssertionError", () => {
  assertThrows(() => {
    assertNever(42 as never);
  }, AssertionError);
});
