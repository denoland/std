// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder,
  stringDecoder,
  stringAsyncDecoder
} from "./test_util.ts";
import { AsyncDecoder, Decoder } from "./decoder.ts";
import { isOptional } from "./is_optional.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isOptional()
 */

test({
  name: "init isOptional()",
  fn: (): void => {
    assertDecoder(isOptional(stringDecoder));
  }
});

test({
  name: "isOptional()",
  fn: (): void => {
    const decoder = isOptional(stringDecoder);

    assertEquals(decoder instanceof Decoder, true);

    for (const item of ["2019-07-03", "heLLooooo", undefined]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, {}, true, null]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string OR must be undefined", {
          decoderName: "isOptional",
          child: new DecoderError(item, "must be a string")
        })
      ]);
    }
  }
});

test({
  name: "async isOptional()",
  fn: async (): Promise<void> => {
    const decoder = isOptional(stringAsyncDecoder);

    assertEquals(decoder instanceof AsyncDecoder, true);

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
