// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isExactly } from './is_exactly.ts';

/**
 * isExactly()
 */

test(function initializes(): void {
  assertDecoder(isExactly(0))
  assertDecoder(isExactly(1))
  assertDecoder(isExactly('0'))
  assertDecoder(isExactly({}))
});

test(function decodesInput(): void {
  const expectedMsgFn = (exact: any) => `must be exactly ${exact}`;
  const obj = {};
  const count = 1;

  const decoder0 = isExactly(1);

  assertDecodeSuccess(decoder0, 1, { expected: 1 });

  for (const item of [true, undefined, 0, 'true']) {
    assertDecodeErrors({
      decoder: decoder0,
      input: item,
      expected: [
        {
          input: item,
          msg: expectedMsgFn(1),
        },
      ],
      count,
    });  
  }

  const decoder1 = isExactly(undefined);

  assertDecodeSuccess(decoder1, undefined, { expected: undefined });

  for (const item of [true, null, 1, 'true']) {
    assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: [
        {
          input: item,
          msg: expectedMsgFn(undefined),
        },
      ],
      count,
    });  
  }

  const decoderObj = isExactly(obj);

  assertDecodeSuccess(decoderObj, obj, { expected: obj });

  const otherObj = {};

  for (const item of [true, undefined, null, 1, 'true', otherObj]) {
    assertDecodeErrors({
      decoder: decoderObj,
      input: item,
      expected: [
        {
          input: item,
          msg: expectedMsgFn(obj),
        },
      ],
      count,
    });  
  }
});

runTests();
