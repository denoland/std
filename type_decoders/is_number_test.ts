// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isNumber } from "./is_number.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isNumber()
 */

test({
  name: "init isNumber()",
  fn: (): void => {
    assertDecoder(isNumber());
  }
});

test({
  name: "isNumber()",
  fn: (): void => {
    const decoder = isNumber();

    for (const item of [
      0,
      -14,
      100,
      4448928342948,
      0.123,
      -342.342342,
      3432432.4
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [{}, null, undefined, "str"]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a number", {
          decoderName: "isNumber"
        })
      ]);
    }
  }
});

runTests();
