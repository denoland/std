// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isBoolean } from './is_boolean.ts';

/**
 * isBoolean()
 */

test(function initializes(): void {
  assertEquals(isBoolean() instanceof Decoder, true);
});

test(function decodesBoolean(): void {
  const decoder = isBoolean();

  assertDecodeSuccess(decoder, true, { expected: true });
  assertDecodeSuccess(decoder, false, { expected: false });

  const msg = 'must be a boolean';
  const length = 1;
  const obj = {};

  assertDecodeErrors({
    decoder,
    input: obj,
    expected: {
      input: obj,
      msg,
      length,
    },
  });
  assertDecodeErrors({
    decoder,
    input: 0,
    expected: {
      input: 0,
      msg,
      length,
    },
  });
  assertDecodeErrors({
    decoder,
    input: 1,
    expected: {
      input: 1,
      msg,
      length,
    },
  });
  assertDecodeErrors({
    decoder,
    input: null,
    expected: {
      input: null,
      msg,
      length,
    },
  });
  assertDecodeErrors({
    decoder,
    input: 'false',
    expected: {
      input: 'false',
      msg,
      length,
    },
  });
});

test(async function decodesPromiseBoolean() {
  const decoder = isBoolean();

  await assertDecodeSuccess(decoder, Promise.resolve(true), { expected: true });
  await assertDecodeSuccess(decoder, Promise.resolve(false), {
    expected: false,
  });

  const msg = 'must be a boolean';
  const length = 1;
  const obj = {};

  await assertDecodeErrors({
    decoder,
    input: Promise.resolve(obj),
    expected: {
      input: obj,
      msg,
      length,
    },
  });
  await assertDecodeErrors({
    decoder,
    input: Promise.resolve(0),
    expected: {
      input: 0,
      msg,
      length,
    },
  });
  await assertDecodeErrors({
    decoder,
    input: Promise.resolve(1),
    expected: {
      input: 1,
      msg,
      length,
    },
  });
  await assertDecodeErrors({
    decoder,
    input: Promise.resolve('false'),
    expected: {
      input: 'false',
      msg,
      length,
    },
  });
});

runTests();
