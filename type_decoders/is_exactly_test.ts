// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isExactly } from './is_exactly.ts';

/**
 * isExactly()
 */

test(function initializes(): void {
  assertEquals(isExactly(0) instanceof Decoder, true);
  assertEquals(isExactly(1) instanceof Decoder, true);
  assertEquals(isExactly('0') instanceof Decoder, true);
  assertEquals(isExactly({}) instanceof Decoder, true);
});

test(function decodesInput(): void {
  const expectedMsgFn = (exact: any) => `must be exactly ${exact}`;
  const length = 1;
  const obj = {};

  const decoder0 = isExactly(1);
  let msg = expectedMsgFn(1);

  assertDecodeSuccess(decoder0, 1, { expected: 1 });

  for (const item of [true, undefined, 0, 'true']) {
    assertDecodeErrors({
      decoder: decoder0,
      input: item,
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const decoder1 = isExactly(undefined);
  msg = expectedMsgFn(undefined);

  assertDecodeSuccess(decoder1, undefined, { expected: undefined });

  for (const item of [true, null, 1, 'true']) {
    assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const decoderObj = isExactly(obj);
  msg = expectedMsgFn(obj);

  assertDecodeSuccess(decoderObj, obj, { expected: obj });

  const otherObj = {};

  for (const item of [true, undefined, null, 1, 'true', otherObj]) {
    assertDecodeErrors({
      decoder: decoderObj,
      input: item,
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }
});

test(async function decodesPromiseInput() {
  const expectedMsgFn = (exact: any) => `must be exactly ${exact}`;
  const length = 1;
  const obj = {};

  const decoder0 = isExactly(1);
  let msg = expectedMsgFn(1);

  assertDecodeSuccess(decoder0, 1, { expected: 1 });

  for (const item of [true, undefined, 0, 'true']) {
    await assertDecodeErrors({
      decoder: decoder0,
      input: Promise.resolve(item),
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const decoder1 = isExactly(undefined);
  msg = expectedMsgFn(undefined);

  assertDecodeSuccess(decoder1, undefined, { expected: undefined });

  for (const item of [true, null, 1, 'true']) {
    await assertDecodeErrors({
      decoder: decoder1,
      input: Promise.resolve(item),
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const decoderObj = isExactly(obj);
  msg = expectedMsgFn(obj);

  assertDecodeSuccess(decoderObj, obj, { expected: obj });

  const otherObj = {};

  for (const item of [true, undefined, null, 1, 'true', otherObj]) {
    await assertDecodeErrors({
      decoder: decoderObj,
      input: Promise.resolve(item),
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }
});

runTests();
