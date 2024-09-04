// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { AssertionError, assertThrows } from "@std/assert";
import { describe, it, test } from "@std/testing/bdd";
import { expect } from "./expect.ts";

Deno.test("expect.hasAssertion()", () => {
  test("test suite hasAssertion() should throw an error", () => {
    assertThrows(() => {
      expect.hasAssertion();
    }, AssertionError);
  });

  describe("hasAssertion() describe test suite", () => {
    it("should throw an error", () => {
      assertThrows(() => {
        expect.hasAssertion();
      }, AssertionError);
    });

    it("pass", () => {
      expect.hasAssertion();
      expect("a").toBe("a");
    });
  });
});
