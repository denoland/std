// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { AssertionError, assertThrows } from "@std/assert";
import { describe, it, test } from "@std/testing/bdd";
import { expect } from "./expect.ts";

Deno.test("expect.hasAssertions()", () => {
  test("test suite hasAssertions() should throw an error", () => {
    assertThrows(() => {
      expect.hasAssertions();
    }, AssertionError);
  });

  describe("hasAssertions() describe test suite", () => {
    it("should throw an error", () => {
      assertThrows(() => {
        expect.hasAssertions();
      }, AssertionError);
    });

    it("pass", () => {
      expect.hasAssertions();
      expect("a").toBe("a");
    });
  });
});

Deno.test("expect.assertions()", () => {
  test("should pass", () => {
    expect.assertions(2);
    expect("a").not.toBe("b");
    expect("a").toBe("a");
  });

  it("redeclare different assertion count", () => {
    expect.assertions(3);
    expect("a").not.toBe("b");
    expect("a").toBe("a");
    expect.assertions(2);
  });

  test("expect no assertions", () => {
    expect.assertions(0);
  });

  it("should throw an error", () => {
    assertThrows(() => {
      expect.assertions(2);
    }, AssertionError);
  });
});
