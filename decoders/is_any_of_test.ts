// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder,
  stringDecoder,
  booleanDecoder,
  numberDecoder,
  booleanAsyncDecoder
} from "./test_util.ts";
import { isAnyOf } from "./is_any_of.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";
import { AsyncDecoder } from "./decoder.ts";
import { assertEquals } from "../testing/asserts.ts";

/**
 * isAnyOf()
 */

test({
  name: "init isAnyOf()",
  fn: (): void => {
    assertDecoder(isAnyOf([]));
    assertDecoder(isAnyOf([stringDecoder]));
    assertDecoder(isAnyOf([numberDecoder, stringDecoder]));
  }
});

test({
  name: "isAnyOf([stringDecoder, booleanDecoder, numberDecoder])",
  fn: (): void => {
    const decoder = isAnyOf([stringDecoder, booleanDecoder, numberDecoder]);

    for (const item of [true, false, "test", "one", 1, 23.432, -3432]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [{}, null, Symbol("one"), ["false"], undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "invalid value", {
          decoderName: "isAnyOf",
          child: new DecoderError(item, "must be a string")
        }),
        new DecoderError(item, "invalid value", {
          decoderName: "isAnyOf",
          child: new DecoderError(item, "must be a boolean")
        }),
        new DecoderError(item, "invalid value", {
          decoderName: "isAnyOf",
          child: new DecoderError(item, "must be a number")
        })
      ]);
    }
  }
});

test({
  name: "async isAnyOf([stringDecoder, booleanDecoder, numberDecoder])",
  fn: async (): Promise<void> => {
    const decoder = isAnyOf([
      stringDecoder,
      booleanAsyncDecoder,
      numberDecoder
    ]);

    assertEquals(decoder instanceof AsyncDecoder, true);

    for (const item of [true, false, "test", "one", 1, 23.432, -3432]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [{}, null, Symbol("one"), ["false"], undefined]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "invalid value", {
          decoderName: "isAnyOf",
          child: new DecoderError(item, "must be a string")
        }),
        new DecoderError(item, "invalid value", {
          decoderName: "isAnyOf",
          child: new DecoderError(item, "must be a boolean")
        }),
        new DecoderError(item, "invalid value", {
          decoderName: "isAnyOf",
          child: new DecoderError(item, "must be a number")
        })
      ]);
    }
  }
});

runTests();
