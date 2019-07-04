// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isMatch } from './is_match.ts';

/**
 * isMatch()
 */

test(function initializes() {
  assertDecoder(isMatch(/one/))
});

test(function decodesInput() {
  const regex = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;

  const decoder = isMatch(regex);

  for (const item of ["2019-07-03", "2000-01-01", "0432-11-30"]) {
    assertDecodeSuccess(decoder, item, { expected: item }); 
  }

  for (const item of [0, -342.342342, {}, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a string',
        },
      ],
      count: 1,
    });  
  }

  for (const item of ["01-01-2019", "2000-00-01", "04321-30", "", "342-43234342"]) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: `must be a string matching the pattern "${regex}"`,
        },
      ],
      count: 1,
    });  
  }
});

runTests();
