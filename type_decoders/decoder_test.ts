// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecoderErrors,
  assertDecoderSuccess,
  assertPromiseDecoderErrors,
  assertPromiseDecoderSuccess,
  assertDecodeErrors
} from "./_testing_util.ts";
import { Decoder, PromiseDecoder } from "./decoder.ts";
import {
  DecoderSuccess,
  DecoderError,
} from "./decoder_result.ts";

/**
 * Decoder
 */

test(function decoderInitializes(): void {
  const decoder = new Decoder(value => new DecoderSuccess(value));
  assertEquals(decoder instanceof Decoder, true);
});

test(function decoderDecodesBooleanValue(): void {
  const decoder = new Decoder((value: unknown) =>
    typeof value === "boolean"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "Value is not a boolean")]
  );

  assertDecoderSuccess(decoder.decode(true));
  assertDecoderSuccess(decoder.decode(false));

  assertDecodeErrors({
    decoder,
    input: 0,
    expected: [
      { input: 0 }
    ]
  })

  assertDecodeErrors({
    decoder,
    input: 1,
    expected: [
      { input: 1 }
    ]
  })

  assertDecodeErrors({
    decoder,
    input: '1',
    expected: [
      { input: '1' }
    ]
  })
});

test(function decoderDecodesStringValue() {
  const decoder = new Decoder((value: unknown) =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "Value is not a string")]
  );

  assertDecoderSuccess(decoder.decode("1"));

  assertDecodeErrors({
    decoder,
    input: true,
    expected: [
      { input: true }
    ]
  })

  assertDecodeErrors({
    decoder,
    input: false,
    expected: [
      { input: false }
    ]
  })

  assertDecodeErrors({
    decoder,
    input: 0,
    expected: [
      { input: 0 }
    ]
  })

  assertDecodeErrors({
    decoder,
    input: 1,
    expected: [
      { input: 1 }
    ]
  })
});

test(async function decoderDecodeReturnsPromiseWhenGivenPromise() {
  const decoder = new Decoder(value => {
    return typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "Value is not a string promise")];
  });

  await assertPromiseDecoderSuccess(decoder.decode(Promise.resolve("true")));

  assertDecodeErrors({
    decoder,
    input: true,
    expected: [
      { input: true }
    ]
  })

  await assertPromiseDecoderErrors(decoder.decode(Promise.resolve(true)));
  await assertPromiseDecoderErrors(decoder.decode(Promise.resolve(1)));
});

/**
 * PromiseDecoder
 */

test(function promiseDecoderInitializes(): void {
  const decoder = new PromiseDecoder(async value => new DecoderSuccess(value));
  assertEquals(decoder instanceof PromiseDecoder, true);
});

test(async function promiseDecoderDecodesBooleanValue() {
  const decoder = new PromiseDecoder((value: unknown) =>
    typeof value === "boolean"
      ? Promise.resolve(new DecoderSuccess(value))
      : Promise.resolve([new DecoderError(value, "Value is not a boolean")])
  );

  await assertPromiseDecoderSuccess(decoder.decode(true));
  await assertPromiseDecoderSuccess(decoder.decode(false));

  await assertPromiseDecoderErrors(decoder.decode(0));
  await assertPromiseDecoderErrors(decoder.decode(1));
  await assertPromiseDecoderErrors(decoder.decode("1"));
});

test(async function promiseDecoderDecodesStringValue() {
  const decoder = new PromiseDecoder((value: unknown) =>
    typeof value === "string"
      ? Promise.resolve(new DecoderSuccess(value))
      : Promise.resolve([new DecoderError(value, "Value is not a string")])
  );

  await assertPromiseDecoderSuccess(decoder.decode("1"));

  await assertPromiseDecoderErrors(decoder.decode(true));
  await assertPromiseDecoderErrors(decoder.decode(false));
  await assertPromiseDecoderErrors(decoder.decode(0));
  await assertPromiseDecoderErrors(decoder.decode(1));
});

runTests();
