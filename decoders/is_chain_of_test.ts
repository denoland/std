// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder,
  stringDecoder,
  numberDecoder
} from "./test_util.ts";
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isChainOf } from "./is_chain_of.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";

/**
 * isChainOf()
 */

test({
  name: "init isChainOf()",
  fn: (): void => {
    assertDecoder(isChainOf([stringDecoder]));
    assertDecoder(isChainOf([stringDecoder, numberDecoder]));
  }
});

test({
  name: "isChainOf([stringDecoder, lengthDecoder])",
  fn: (): void => {
    const lengthDecoder = new Decoder<string, string>(
      (value): DecoderResult<string> =>
        value.length > 10
          ? new DecoderSuccess(value)
          : [new DecoderError(value, "string must have length greater than 10")]
    );

    const decoder = isChainOf([stringDecoder, lengthDecoder]);

    for (const item of [
      "thisistenletters",
      "morethan10letters",
      "iamelevenle"
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of ["test", "iameEDvenl", ""]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "string must have length greater than 10", {
          decoderName: "isChainOf",
          child: new DecoderError(
            item,
            "string must have length greater than 10"
          )
        })
      ]);
    }

    for (const item of [true, false, 1, 23.432, -3432]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string", {
          decoderName: "isChainOf",
          child: new DecoderError(item, "must be a string")
        })
      ]);
    }
  }
});

test({
  name: "async isChainOf([stringDecoder, lengthDecoder])",
  fn: async (): Promise<void> => {
    const lengthDecoder = new PromiseDecoder<string, string>(
      async (value): Promise<DecoderResult<string>> =>
        value.length > 10
          ? new DecoderSuccess(value)
          : [new DecoderError(value, "string must have length greater than 10")]
    );

    const decoder = isChainOf([stringDecoder, lengthDecoder]);

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of [
      "thisistenletters",
      "morethan10letters",
      "iamelevenle"
    ]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of ["test", "iameEDvenl", ""]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "string must have length greater than 10", {
          decoderName: "isChainOf",
          child: new DecoderError(
            item,
            "string must have length greater than 10"
          )
        })
      ]);
    }

    for (const item of [true, false, 1, 23.432, -3432]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string", {
          decoderName: "isChainOf",
          child: new DecoderError(item, "must be a string")
        })
      ]);
    }
  }
});

runTests();
