// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder,
  stringDecoder,
  stringPromiseDecoder
} from "./test_util.ts";
import { PromiseDecoder } from "./decoder.ts";
import { isOptional } from "./is_optional.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isOptional()
 */

test({
  name: "init isOptional()",
  fn: () => {
    assertDecoder(isOptional(stringDecoder));
  }
});

test({
  name: "async isOptional()",
  fn: async () => {
    const decoder = isOptional(stringPromiseDecoder);

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of ["2019-07-03", "heLLooooo", undefined]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, {}, true, null]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string OR must be undefined", {
          decoderName: "isOptional",
          child: new DecoderError(item, "must be a string")
        })
      ]);
    }
  }
});

runTests();
