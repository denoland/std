// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isInteger } from "./is_integer.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isInteger()
 */

test({
  name: "init isInteger()",
  fn: () => {
    assertDecoder(isInteger());
  }
});

test({
  name: "isInteger()",
  fn: () => {
    const decoder = isInteger();

    for (const item of [0, -14, 100, 4448928342948]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [
      0.123,
      -342.342342,
      3432432.4,
      {},
      null,
      undefined,
      "str"
    ]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a whole number", {
          decoderName: "isInteger"
        })
      ]);
    }
  }
});

runTests();
