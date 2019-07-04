// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder, stringDecoder, numberDecoder, booleanDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isMaybe } from './is_maybe.ts';

/**
 * isMaybe()
 */

test(function initializes() {
  assertDecoder(isMaybe(stringDecoder))
});

test(function decodesInput() {
  const maybeString = isMaybe(stringDecoder);
  const maybeNumber = isMaybe(numberDecoder);
  const maybeBoolean = isMaybe(booleanDecoder);

  for (const item of ["2019-07-03", "heLLooooo", null, undefined]) {
    assertDecodeSuccess(maybeString, item, { expected: item }); 
  }

  for (const item of [234.03432, -324, null, undefined]) {
    assertDecodeSuccess(maybeNumber, item, { expected: item }); 
  }

  for (const item of [true, false, null, undefined]) {
    assertDecodeSuccess(maybeBoolean, item, { expected: item }); 
  }


  for (const item of [0, {}, true]) {
    assertDecodeErrors({
      decoder: maybeString,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a string OR must be null OR must be undefined',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["one", {}, Symbol('two')]) {
    assertDecodeErrors({
      decoder: maybeNumber,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a number OR must be null OR must be undefined',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["one", {}, Symbol('two'), 0]) {
    assertDecodeErrors({
      decoder: maybeBoolean,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a boolean OR must be null OR must be undefined',
        },
      ],
      count: 1,
    });  
  }
});

runTests();
