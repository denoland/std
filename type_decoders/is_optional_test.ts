// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder, stringDecoder, numberDecoder, booleanDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isOptional } from './is_optional.ts';

/**
 * isOptional()
 */

test(function initializes() {
  assertDecoder(isOptional(stringDecoder))
});

test(function decodesInput() {
  const optionalString = isOptional(stringDecoder);
  const optionalNumber = isOptional(numberDecoder);
  const optionalBoolean = isOptional(booleanDecoder);

  for (const item of ["2019-07-03", "heLLooooo", undefined]) {
    assertDecodeSuccess(optionalString, item, { expected: item }); 
  }

  for (const item of [234.03432, -324, undefined]) {
    assertDecodeSuccess(optionalNumber, item, { expected: item }); 
  }

  for (const item of [true, false, undefined]) {
    assertDecodeSuccess(optionalBoolean, item, { expected: item }); 
  }


  for (const item of [0, {}, true, null]) {
    assertDecodeErrors({
      decoder: optionalString,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a string OR must be undefined',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["one", {}, Symbol('two'), null]) {
    assertDecodeErrors({
      decoder: optionalNumber,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a number OR must be undefined',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["one", {}, Symbol('two'), 0, null]) {
    assertDecodeErrors({
      decoder: optionalBoolean,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a boolean OR must be undefined',
        },
      ],
      count: 1,
    });  
  }
});

runTests();
