// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isConstant } from './is_constant.ts';

/**
 * isConstant()
 */

test(function initializes(): void {
  assertEquals(isConstant(0) instanceof Decoder, true);
  assertEquals(isConstant(1) instanceof Decoder, true);
  assertEquals(isConstant('0') instanceof Decoder, true);
  assertEquals(isConstant({}) instanceof Decoder, true);
});

test(function decodesInput(): void {
  const decoder0 = isConstant(0);

  for (const item of [true, false, {}, 'false']) {
    assertDecodeSuccess(decoder0, item, { expected: 0 });
  }

  const decoder1 = isConstant('one');

  for (const item of [true, false, {}, 'false']) {
    assertDecodeSuccess(decoder1, item, { expected: 'one' });
  }

  const obj = {};
  const decoderObj = isConstant(obj);

  for (const item of [true, false, {}, 'false']) {
    assertDecodeSuccess(decoderObj, item, { expected: obj });
  }
});

test(async function decodesPromiseInput() {
  const decoder0 = isConstant(0);

  for (const item of [true, false, {}, 'false']) {
    await assertDecodeSuccess(decoder0, Promise.resolve(item), { expected: 0 });
  }

  const decoder1 = isConstant('one');

  for (const item of [true, false, {}, 'false']) {
    await assertDecodeSuccess(decoder1, Promise.resolve(item), {
      expected: 'one',
    });
  }

  const obj = {};
  const decoderObj = isConstant(obj);

  for (const item of [true, false, {}, 'false']) {
    await assertDecodeSuccess(decoderObj, Promise.resolve(item), {
      expected: obj,
    });
  }
});

runTests();
