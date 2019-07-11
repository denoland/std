// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodesToErrors,
  stringDecoder,
  booleanDecoder,
  assertDecodesToSuccess,
  booleanAsyncDecoder
} from "./test_util.ts";
import { Decoder, AsyncDecoder } from "./decoder.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * Decoder
 */

test({
  name: "new Decoder",
  fn: (): void => {
    assertEquals(stringDecoder instanceof Decoder, true);
  }
});

test({
  name: "Decoder.decode",
  fn: async (): Promise<void> => {
    const decoder = booleanDecoder;

    assertDecodesToSuccess(decoder, true, new DecoderSuccess(true));
    assertDecodesToSuccess(decoder, false, new DecoderSuccess(false));
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(true),
      new DecoderSuccess(true)
    );
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(false),
      new DecoderSuccess(false)
    );

    assertDecodesToErrors(decoder, 0, [
      new DecoderError(0, "must be a boolean")
    ]);
    await assertDecodesToErrors(decoder, Promise.resolve(0), [
      new DecoderError(0, "must be a boolean")
    ]);
  }
});

test({
  name: "Decoder.map",
  fn: async (): Promise<void> => {
    const decoder = booleanDecoder.map((value): boolean => !value);

    assertDecodesToSuccess(decoder, true, new DecoderSuccess(false));
    assertDecodesToSuccess(decoder, false, new DecoderSuccess(true));
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(true),
      new DecoderSuccess(false)
    );
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(false),
      new DecoderSuccess(true)
    );

    assertDecodesToErrors(decoder, 0, [
      new DecoderError(0, "must be a boolean")
    ]);
    await assertDecodesToErrors(decoder, Promise.resolve(0), [
      new DecoderError(0, "must be a boolean")
    ]);
  }
});

/**
 * AsyncDecoder
 */

test({
  name: "new AsyncDecoder",
  fn: (): void => {
    assertEquals(booleanAsyncDecoder instanceof AsyncDecoder, true);
  }
});

test({
  name: "AsyncDecoder.decode",
  fn: async (): Promise<void> => {
    const decoder = booleanAsyncDecoder;

    await assertDecodesToSuccess(decoder, true, new DecoderSuccess(true));
    await assertDecodesToSuccess(decoder, false, new DecoderSuccess(false));
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(true),
      new DecoderSuccess(true)
    );
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(false),
      new DecoderSuccess(false)
    );

    await assertDecodesToErrors(decoder, 0, [
      new DecoderError(0, "must be a boolean")
    ]);
    await assertDecodesToErrors(decoder, Promise.resolve(0), [
      new DecoderError(0, "must be a boolean")
    ]);
  }
});

test({
  name: "AsyncDecoder.map",
  fn: async (): Promise<void> => {
    const decoder = booleanAsyncDecoder.map((value): boolean => !value);

    await assertDecodesToSuccess(decoder, true, new DecoderSuccess(false));
    await assertDecodesToSuccess(decoder, false, new DecoderSuccess(true));
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(true),
      new DecoderSuccess(false)
    );
    await assertDecodesToSuccess(
      decoder,
      Promise.resolve(false),
      new DecoderSuccess(true)
    );

    await assertDecodesToErrors(decoder, 0, [
      new DecoderError(0, "must be a boolean")
    ]);
    await assertDecodesToErrors(decoder, Promise.resolve(0), [
      new DecoderError(0, "must be a boolean")
    ]);
  }
});

runTests();
