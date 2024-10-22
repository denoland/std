// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { describe, it, test } from "@std/testing/bdd";
import { expect } from "./expect.ts";

Deno.test("expect.hasAssertions() API", () => {
  describe("describe suite", () => {
    // FIXME(eryue0220): This test should through `toThrowErrorMatchingSnapshot`
    it("should throw an error", () => {
      expect.hasAssertions();
    });

    it("should pass", () => {
      expect.hasAssertions();
      expect("a").toEqual("a");
    });
  });

  it("it() suite should pass", () => {
    expect.hasAssertions();
    expect("a").toEqual("a");
  });

  // FIXME(eryue0220): This test should through `toThrowErrorMatchingSnapshot`
  test("test suite should throw an error", () => {
    expect.hasAssertions();
  });

  test("test suite should pass", () => {
    expect.hasAssertions();
    expect("a").toEqual("a");
  });
});

Deno.test("expect.assertions() API", () => {
  test("should pass", () => {
    expect.assertions(2);
    expect("a").not.toBe("b");
    expect("a").toBe("a");
  });

  // FIXME(eryue0220): This test should through `toThrowErrorMatchingSnapshot`
  test("should throw error", () => {
    expect.assertions(1);
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

  // FIXME(eryue0220): This test should through `toThrowErrorMatchingSnapshot`
  it("should throw an error", () => {
    expect.assertions(2);
  });
});
