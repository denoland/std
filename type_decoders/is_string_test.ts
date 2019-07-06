// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isString } from "./is_string.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isString()
 */

test({
  name: "init isString()",
  fn: () => {
    assertDecoder(isString());
  }
});

test({
  name: "isString()",
  fn: () => {
    const decoder = isString();

    for (const item of ["0", "-14"]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, -342.342342, {}, null, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string", {
          decoderName: "isString"
        })
      ]);
    }
  }
});

runTests();
