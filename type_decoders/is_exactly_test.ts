// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isExactly } from "./is_exactly.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isExactly()
 */

test({
  name: "init isExactly()",
  fn: (): void => {
    assertDecoder(isExactly(0));
    assertDecoder(isExactly(1));
    assertDecoder(isExactly("0"));
    assertDecoder(isExactly({}));
  }
});

test({
  name: "isExactly(1)",
  fn: (): void => {
    const decoder = isExactly(1);

    assertDecodesToSuccess(decoder, 1, new DecoderSuccess(1));

    for (const item of [true, undefined, 0, "true", {}]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be exactly 1", {
          decoderName: "isExactly"
        })
      ]);
    }
  }
});

test({
  name: "isExactly(undefined)",
  fn: (): void => {
    const decoder = isExactly(undefined);

    assertDecodesToSuccess(decoder, undefined, new DecoderSuccess(undefined));

    for (const item of [true, null, 0, "true", {}]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be exactly undefined", {
          decoderName: "isExactly"
        })
      ]);
    }
  }
});

test({
  name: "isExactly(null)",
  fn: (): void => {
    const decoder = isExactly(null);

    assertDecodesToSuccess(decoder, null, new DecoderSuccess(null));

    for (const item of [true, undefined, 0, "true", {}]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be exactly null", {
          decoderName: "isExactly"
        })
      ]);
    }
  }
});

test({
  name: "isExactly({})",
  fn: (): void => {
    const obj = {};
    const decoder = isExactly(obj);

    assertDecodesToSuccess(decoder, obj, new DecoderSuccess(obj));

    for (const item of [true, undefined, 0, "true", {}]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be exactly [object Object]", {
          decoderName: "isExactly"
        })
      ]);
    }
  }
});

runTests();
