// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertNotInstanceOf, assertThrows } from "./mod.ts";

Deno.test({
  name: "assertNotInstanceOf()",
  fn() {
    assertNotInstanceOf("not a number", Number);
    assertNotInstanceOf(42, String);
    assertNotInstanceOf(new URL("http://example.com"), Boolean);
  },
});

Deno.test({
  name: "assertNotInstanceOf() accepts abstract class",
  fn() {
    abstract class AbstractClass {}

    assertNotInstanceOf(AbstractClass, AbstractClass);
  },
});

Deno.test({
  name: "assertNotInstanceOf() throws",
  fn() {
    assertThrows(
      () => assertNotInstanceOf(new Date(), Date),
      AssertionError,
      'Expected object to not be an instance of "function".',
    );
  },
});

Deno.test({
  name: "assertNotInstanceOf() throws with custom message",
  fn() {
    assertThrows(
      () => assertNotInstanceOf(new Date(), Date, "CUSTOM MESSAGE"),
      AssertionError,
      'Expected object to not be an instance of "function": CUSTOM MESSAGE',
    );
  },
});
