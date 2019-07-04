// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodeSuccess,
  assertDecodeErrors,
  assertDecoder
} from "./_testing_util.ts";
import { Decoder } from "./decoder.ts";
import { isAny } from "./is_any.ts";

/**
 * isAny()
 */

test(function initializes() {
  assertDecoder(isAny());
});

test(function decodesInput() {
  const decoder = isAny();

  for (const item of [true, false, {}, "false", [], Symbol(), Set]) {
    assertDecodeSuccess(decoder, item, { expected: item });
  }
});

runTests();
