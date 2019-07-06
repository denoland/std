// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertDecodesToSuccess, assertDecoder } from "./test_util.ts";
import { isConstant } from "./is_constant.ts";
import { DecoderSuccess } from "./decoder_result.ts";

/**
 * isConstant()
 */

test({
  name: "init isConstant()",
  fn: () => {
    assertDecoder(isConstant(0));
    assertDecoder(isConstant(1));
    assertDecoder(isConstant("0"));
    assertDecoder(isConstant({}));
  }
});

test({
  name: "isConstant(0).decode",
  fn: () => {
    const decoder = isConstant(0);

    for (const item of [true, false, {}, "false"]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(0));
    }
  }
});

test({
  name: 'isConstant("one").decode',
  fn: () => {
    const decoder = isConstant("one");

    for (const item of [true, false, {}, "false"]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess("one"));
    }
  }
});

test({
  name: "isConstant({}).decode",
  fn: () => {
    const obj = {};
    const decoder = isConstant(obj);

    for (const item of [true, false, {}, "false"]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(obj));
    }
  }
});

runTests();
