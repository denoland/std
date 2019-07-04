// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder, stringDecoder, numberDecoder, booleanDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isNullable } from './is_nullable.ts';

/**
 * isNullable()
 */

test(function initializes() {
  assertDecoder(isNullable(stringDecoder))
});

test(function decodesInput() {
  const nullableString = isNullable(stringDecoder);
  const nullableNumber = isNullable(numberDecoder);
  const nullableBoolean = isNullable(booleanDecoder);

  for (const item of ["2019-07-03", "heLLooooo", null]) {
    assertDecodeSuccess(nullableString, item, { expected: item }); 
  }

  for (const item of [234.03432, -324, null]) {
    assertDecodeSuccess(nullableNumber, item, { expected: item }); 
  }

  for (const item of [true, false, null]) {
    assertDecodeSuccess(nullableBoolean, item, { expected: item }); 
  }


  for (const item of [0, {}, true, undefined]) {
    assertDecodeErrors({
      decoder: nullableString,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a string OR must be null',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["one", {}, Symbol('two'), undefined]) {
    assertDecodeErrors({
      decoder: nullableNumber,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a number OR must be null',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["one", {}, Symbol('two'), 0, undefined]) {
    assertDecodeErrors({
      decoder: nullableBoolean,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a boolean OR must be null',
        },
      ],
      count: 1,
    });  
  }
});

runTests();
