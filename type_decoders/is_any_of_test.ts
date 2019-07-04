// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder, stringDecoder, booleanDecoder, numberDecoder } from './_testing_util.ts';
import { isAnyOf } from './is_any_of.ts';

/**
 * isAnyOf()
 */

test(function initializes(): void {
  assertDecoder(isAnyOf([]))
  assertDecoder(isAnyOf([stringDecoder]))
  assertDecoder(isAnyOf([numberDecoder, stringDecoder]))
});

test(function noOptions(): void {
  const decoder = isAnyOf([
    stringDecoder,
    booleanDecoder,
    numberDecoder,
  ]);

  for (const item of [true, false, 'test', 'one', 1, 23.432, -3432]) {
    assertDecodeSuccess(decoder, item, { expected: item });
  }

  for (const item of [{}, null, Symbol('one'), ['false'], undefined]) {
    assertDecodeErrors({
      decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'invalid value',
        },
      ],
      count: 3,
    });
  }
});

runTests();
