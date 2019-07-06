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
import { isMaybe } from "./is_maybe.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isMaybe()
 */

test({
  name: "init isMaybe()",
  fn: () => {
    assertDecoder(isMaybe(stringDecoder));
  }
});

test({
  name: "isMaybe()",
  fn: () => {
    const decoder = isMaybe(stringDecoder);

    for (const item of ["2019-07-03", "heLLooooo", null, undefined]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, {}, true]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(
          item,
          "must be a string OR must be null OR must be undefined",
          {
            decoderName: "isMaybe",
            child: new DecoderError(item, "must be a string")
          }
        )
      ]);
    }
  }
});

test({
  name: "async isMaybe()",
  fn: async () => {
    const decoder = isMaybe(stringPromiseDecoder);

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of ["2019-07-03", "heLLooooo", null, undefined]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, {}, true]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(
          item,
          "must be a string OR must be null OR must be undefined",
          {
            decoderName: "isMaybe",
            child: new DecoderError(item, "must be a string")
          }
        )
      ]);
    }
  }
});

runTests();
