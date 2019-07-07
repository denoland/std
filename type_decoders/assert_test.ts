// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "../testing/asserts.ts";
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { assert, DecoderAssertError } from "./assert.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";

/**
 * assert()
 */

test({
  name: "assertFn()",
  fn: (): void => {
    const decoder = new Decoder(
      (value): DecoderResult<1> =>
        value === 1
          ? new DecoderSuccess(1)
          : [new DecoderError(value, "must be 1")]
    );

    const isOne = assert(decoder);

    assertEquals(isOne(1), 1);

    assertThrows((): 1 => isOne(true), DecoderAssertError, "must be 1");

    let thrown = false;
    try {
      isOne(true);
    } catch (e) {
      const err: DecoderAssertError = e;
      thrown = true;

      assertEquals(err.errors.length, 1);
      assertEquals(err.errors[0].message, "must be 1");
    }

    assertEquals(thrown, true, "assert() did not throw on error");
  }
});

test({
  name: "async assertFn()",
  fn: async (): Promise<void> => {
    const decoder = new PromiseDecoder(
      async (value): Promise<DecoderResult<1>> =>
        value === 1
          ? new DecoderSuccess(1)
          : [new DecoderError(value, "must be 1")]
    );

    const isOne = assert(decoder);

    assertEquals(isOne(1) instanceof Promise, true);
    assertEquals(await isOne(1), 1);

    await assertThrowsAsync(
      async (): Promise<void> => {
        await isOne(true);
      },
      DecoderAssertError,
      "must be 1"
    );

    let thrown = false;
    try {
      await isOne(true);
    } catch (e) {
      const err: DecoderAssertError = e;
      thrown = true;

      assertEquals(err.errors.length, 1);
      assertEquals(err.errors[0].message, "must be 1");
    }

    assertEquals(thrown, true, "assert() did not throw on error");
  }
});

runTests();
