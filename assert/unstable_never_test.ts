// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertThrows } from "./mod.ts";
import { assertNever } from "./unstable_never.ts";

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
