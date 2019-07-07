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
import { isArray } from "./is_array.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isArray()
 */

test({
  name: "init isArray()",
  fn: (): void => {
    assertDecoder(isArray());
  }
});

test({
  name: "isArray()",
  fn: (): void => {
    const decoder = isArray();

    for (const item of [[], [1, "string"], new Array(1000)]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [true, false, {}, "false", Symbol(), Set]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be an array", {
          decoderName: "isArray"
        })
      ]);
    }
  }
});

test({
  name: "isArray(stringDecoder)",
  fn: (): void => {
    const decoder = isArray(stringDecoder);

    const array1 = [1, null];
    assertDecodesToErrors(decoder, array1, [
      new DecoderError(array1, "invalid element [0] > must be a string", {
        decoderName: "isArray",
        location: "[0]",
        key: 0,
        child: new DecoderError(array1[0], "must be a string")
      })
    ]);

    const array2 = ["two", 1, "green", undefined, new Set()];
    assertDecodesToErrors(decoder, array2, [
      new DecoderError(array2, "invalid element [1] > must be a string", {
        decoderName: "isArray",
        location: "[1]",
        key: 1,
        child: new DecoderError(array2[1], "must be a string")
      })
    ]);
  }
});

test({
  name: "isArray(stringDecoder, {allErrors: true})",
  fn: (): void => {
    const decoder = isArray(stringDecoder, {
      allErrors: true
    });

    const array1 = [1, null];
    assertDecodesToErrors(decoder, array1, [
      new DecoderError(array1, "invalid element [0] > must be a string", {
        decoderName: "isArray",
        location: "[0]",
        key: 0,
        allErrors: true,
        child: new DecoderError(array1[0], "must be a string")
      }),
      new DecoderError(array1, "invalid element [1] > must be a string", {
        decoderName: "isArray",
        location: "[1]",
        key: 1,
        allErrors: true,
        child: new DecoderError(array1[1], "must be a string")
      })
    ]);

    const array2 = ["two", 1, "green", undefined, new Set()];
    assertDecodesToErrors(decoder, array2, [
      new DecoderError(array2, "invalid element [1] > must be a string", {
        decoderName: "isArray",
        location: "[1]",
        key: 1,
        allErrors: true,
        child: new DecoderError(array2[1], "must be a string")
      }),
      new DecoderError(array2, "invalid element [3] > must be a string", {
        decoderName: "isArray",
        location: "[3]",
        key: 3,
        allErrors: true,
        child: new DecoderError(array2[3], "must be a string")
      }),
      new DecoderError(array2, "invalid element [4] > must be a string", {
        decoderName: "isArray",
        location: "[4]",
        key: 4,
        allErrors: true,
        child: new DecoderError(array2[4], "must be a string")
      })
    ]);
  }
});

test({
  name: "async isArray(stringDecoder)",
  fn: async (): Promise<void> => {
    const decoder = isArray(stringPromiseDecoder);

    assertEquals(decoder instanceof PromiseDecoder, true);

    const array1 = [1, null];
    await assertDecodesToErrors(decoder, array1, [
      new DecoderError(array1, "invalid element [0] > must be a string", {
        decoderName: "isArray",
        location: "[0]",
        key: 0,
        child: new DecoderError(array1[0], "must be a string")
      })
    ]);

    const array2 = ["two", 1, "green", undefined, new Set()];
    await assertDecodesToErrors(decoder, array2, [
      new DecoderError(array2, "invalid element [1] > must be a string", {
        decoderName: "isArray",
        location: "[1]",
        key: 1,
        child: new DecoderError(array2[1], "must be a string")
      })
    ]);
  }
});

test({
  name: "async isArray(stringDecoder, {allErrors: true})",
  fn: async (): Promise<void> => {
    const decoder = isArray(stringPromiseDecoder, {
      allErrors: true
    });

    assertEquals(decoder instanceof PromiseDecoder, true);

    const array1 = [1, null];
    await assertDecodesToErrors(decoder, array1, [
      new DecoderError(array1, "invalid element [0] > must be a string", {
        decoderName: "isArray",
        location: "[0]",
        key: 0,
        allErrors: true,
        child: new DecoderError(array1[0], "must be a string")
      }),
      new DecoderError(array1, "invalid element [1] > must be a string", {
        decoderName: "isArray",
        location: "[1]",
        key: 1,
        allErrors: true,
        child: new DecoderError(array1[1], "must be a string")
      })
    ]);

    const array2 = ["two", 1, "green", undefined, new Set()];
    await assertDecodesToErrors(decoder, array2, [
      new DecoderError(array2, "invalid element [1] > must be a string", {
        decoderName: "isArray",
        location: "[1]",
        key: 1,
        allErrors: true,
        child: new DecoderError(array2[1], "must be a string")
      }),
      new DecoderError(array2, "invalid element [3] > must be a string", {
        decoderName: "isArray",
        location: "[3]",
        key: 3,
        allErrors: true,
        child: new DecoderError(array2[3], "must be a string")
      }),
      new DecoderError(array2, "invalid element [4] > must be a string", {
        decoderName: "isArray",
        location: "[4]",
        key: 4,
        allErrors: true,
        child: new DecoderError(array2[4], "must be a string")
      })
    ]);
  }
});

runTests();
