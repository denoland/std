// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

test(function initializeDecoder(): void {
  const decoder = new Decoder(value => new DecoderSuccess(value));
  assertEquals(decoder instanceof Decoder, true);
});

test(function decodesBooleanValue(): void {
  const decoder = new Decoder((value: unknown) =>
    typeof value === "boolean"
      ? new DecoderSuccess(value)
      : new DecoderError(value, "Value is not a boolean")
  );

  assertEquals(decoder.decode(true) instanceof DecoderSuccess, true);
  assertEquals(decoder.decode(false) instanceof DecoderSuccess, true);
  assertEquals(decoder.decode(0) instanceof DecoderError, true);
  assertEquals(decoder.decode(1) instanceof DecoderError, true);
  assertEquals(decoder.decode("1") instanceof DecoderError, true);
});

test(function decodesStringValue() {
  const decoder = new Decoder((value: unknown) =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : new DecoderError(value, "Value is not a string")
  );

  assertEquals(decoder.decode(true) instanceof DecoderError, true);
  assertEquals(decoder.decode(false) instanceof DecoderError, true);
  assertEquals(decoder.decode(0) instanceof DecoderError, true);
  assertEquals(decoder.decode(1) instanceof DecoderError, true);
  assertEquals(decoder.decode("1") instanceof DecoderSuccess, true);
});

test(async function returnPromiseWhenGivenPromiseValue() {
  const decoder = new Decoder(value => {
    return typeof value === "string"
      ? new DecoderSuccess(value)
      : new DecoderError(value, "Value is not a string promise");
  });

  assertEquals(
    decoder.decode(true) instanceof DecoderError,
    true,
    "error on boolean"
  );

  assertEquals(
    decoder.decode(Promise.resolve(true)) instanceof Promise,
    true,
    "returns a promise"
  );

  assertEquals(
    (await decoder.decode(Promise.resolve(true))) instanceof DecoderError,
    true,
    "promise error on promise boolean"
  );

  assertEquals(
    (await decoder.decode(Promise.resolve(1))) instanceof DecoderError,
    true,
    "promise error on promise number"
  );

  assertEquals(
    (await decoder.decode(Promise.resolve("true"))) instanceof DecoderSuccess,
    true,
    "promise success on promise string"
  );
});

test(function initializePromiseDecoder(): void {
  const decoder = new PromiseDecoder(async value => new DecoderSuccess(value));
  assertEquals(decoder instanceof PromiseDecoder, true);
});

test(async function decodesBooleanValue() {
  const decoder = new PromiseDecoder((value: unknown) =>
    typeof value === "boolean"
      ? Promise.resolve(new DecoderSuccess(value))
      : Promise.resolve(new DecoderError(value, "Value is not a boolean"))
  );

  assertEquals(decoder.decode(true) instanceof Promise, true);
  assertEquals((await decoder.decode(true)) instanceof DecoderSuccess, true);
  assertEquals((await decoder.decode(false)) instanceof DecoderSuccess, true);
  assertEquals((await decoder.decode(0)) instanceof DecoderError, true);
  assertEquals((await decoder.decode(1)) instanceof DecoderError, true);
  assertEquals((await decoder.decode("1")) instanceof DecoderError, true);
});

test(async function decodesStringValue() {
  const decoder = new PromiseDecoder((value: unknown) =>
    typeof value === "string"
      ? Promise.resolve(new DecoderSuccess(value))
      : Promise.resolve(new DecoderError(value, "Value is not a string"))
  );

  assertEquals(decoder.decode(true) instanceof Promise, true);
  assertEquals((await decoder.decode(true)) instanceof DecoderError, true);
  assertEquals((await decoder.decode(false)) instanceof DecoderError, true);
  assertEquals((await decoder.decode(0)) instanceof DecoderError, true);
  assertEquals((await decoder.decode(1)) instanceof DecoderError, true);
  assertEquals((await decoder.decode("1")) instanceof DecoderSuccess, true);
});

runTests();
