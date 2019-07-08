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
import { isNullable } from "./is_nullable.ts";
import { DecoderError, DecoderSuccess } from "./decoder_result.ts";

/**
 * isNullable()
 */

test({
  name: "init isNullable()",
  fn: (): void => {
    assertDecoder(isNullable(stringDecoder));
  }
});

test({
  name: "isNullable()",
  fn: (): void => {
    const decoder = isNullable(stringDecoder);

    for (const item of ["2019-07-03", "heLLooooo", null]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, {}, true, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string OR must be null", {
          decoderName: "isNullable",
          child: new DecoderError(item, "must be a string")
        })
      ]);
    }
  }
});

test({
  name: "async isNullable()",
  fn: async (): Promise<void> => {
    const decoder = isNullable(stringPromiseDecoder);

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of ["2019-07-03", "heLLooooo", null]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, {}, true, undefined]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string OR must be null", {
          decoderName: "isNullable",
          child: new DecoderError(item, "must be a string")
        })
      ]);
    }
  }
});

runTests();
