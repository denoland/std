// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder,
  stringDecoder,
  booleanDecoder,
  booleanPromiseDecoder
} from "./test_util.ts";
import { PromiseDecoder } from "./decoder.ts";
import { isTuple } from "./is_tuple.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isTuple()
 */

test({
  name: "init isTuple()",
  fn: (): void => {
    assertDecoder(isTuple([stringDecoder]));
    assertDecoder(isTuple([stringDecoder, stringDecoder]));
  }
});

test({
  name: "isTuple([stringDecoder, booleanDecoder])",
  fn: (): void => {
    const decoder = isTuple([stringDecoder, booleanDecoder]);

    for (const item of [["string", true], ["", false]]) {
      // isTuple returns a new array so we can't use the `expected` option
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [{}, null, undefined, 1, true, "happy"]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be an array", {
          decoderName: "isTuple"
        })
      ]);
    }

    const obj1 = [10, true];
    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, "invalid element [0] > must be a string", {
        decoderName: "isTuple",
        location: "[0]",
        key: 0,
        child: new DecoderError(obj1[0], "must be a string")
      })
    ]);

    const obj2 = ["one", true, -2];
    assertDecodesToErrors(decoder, obj2, [
      new DecoderError(obj2, "array must have length 2", {
        decoderName: "isTuple"
      })
    ]);

    const obj3 = ["{}", {}];
    assertDecodesToErrors(decoder, obj3, [
      new DecoderError(obj3, "invalid element [1] > must be a boolean", {
        decoderName: "isTuple",
        location: "[1]",
        key: 1,
        child: new DecoderError(obj3[1], "must be a boolean")
      })
    ]);
  }
});

test({
  name: "isTuple([stringDecoder, booleanDecoder], {allErrors: true})",
  fn: (): void => {
    const decoder = isTuple([stringDecoder, booleanDecoder], {
      allErrors: true
    });

    for (const item of [["string", true], ["", false]]) {
      // isTuple returns a new array so we can't use the `expected` option
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    const obj1 = ["{}", {}, true];
    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, "invalid element [1] > must be a boolean", {
        decoderName: "isTuple",
        location: "[1]",
        key: 1,
        allErrors: true,
        child: new DecoderError(obj1[1], "must be a boolean")
      }),
      new DecoderError(obj1, "array must have length 2", {
        decoderName: "isTuple",
        allErrors: true
      })
    ]);
  }
});

test({
  name: "async isTuple([stringDecoder, booleanDecoder])",
  fn: async (): Promise<void> => {
    const decoder = isTuple([stringDecoder, booleanPromiseDecoder]);

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of [["string", true], ["", false]]) {
      // isTuple returns a new array so we can't use the `expected` option
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [{}, null, undefined, 1, true, "happy"]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be an array", {
          decoderName: "isTuple"
        })
      ]);
    }

    const obj1 = [10, true];
    await assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, "invalid element [0] > must be a string", {
        decoderName: "isTuple",
        location: "[0]",
        key: 0,
        child: new DecoderError(obj1[0], "must be a string")
      })
    ]);

    const obj2 = ["one", true, -2];
    await assertDecodesToErrors(decoder, obj2, [
      new DecoderError(obj2, "array must have length 2", {
        decoderName: "isTuple"
      })
    ]);

    const obj3 = ["{}", {}];
    await assertDecodesToErrors(decoder, obj3, [
      new DecoderError(obj3, "invalid element [1] > must be a boolean", {
        decoderName: "isTuple",
        location: "[1]",
        key: 1,
        child: new DecoderError(obj3[1], "must be a boolean")
      })
    ]);
  }
});

test({
  name: "async isTuple([stringDecoder, booleanDecoder], {allErrors: true})",
  fn: async (): Promise<void> => {
    const decoder = isTuple([stringDecoder, booleanPromiseDecoder], {
      allErrors: true
    });

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of [["string", true], ["", false]]) {
      // isTuple returns a new array so we can't use the `expected` option
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    const obj1 = ["{}", {}, true];
    await assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, "invalid element [1] > must be a boolean", {
        decoderName: "isTuple",
        location: "[1]",
        key: 1,
        allErrors: true,
        child: new DecoderError(obj1[1], "must be a boolean")
      }),
      new DecoderError(obj1, "array must have length 2", {
        decoderName: "isTuple",
        allErrors: true
      })
    ]);
  }
});

runTests();
