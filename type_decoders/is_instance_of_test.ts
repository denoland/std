// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isInstanceOf } from './is_instance_of.ts';

/**
 * isInstanceOf()
 */

test(function initializes() {
  assertDecoder(isInstanceOf(Map))
  assertDecoder(isInstanceOf(Array))
  assertDecoder(isInstanceOf(Set))
});

test(function decodesInput() {
  const expectedMsg = (clazz: any) => `must be an instance of ${clazz.name}`;
  const count = 1;
  const map = new Map();
  const set = new Set();
  const array = [];

  const mapDecoder = isInstanceOf(Map);

  assertDecodeSuccess(mapDecoder, map, { expected: map });

  for (const item of [{}, null, 0, undefined, 'str', set, array]) {
    assertDecodeErrors({
      decoder: mapDecoder,
      input: item,
      expected: [
        {
          input: item,
          msg: expectedMsg(Map),
        },
      ],
      count,
    });  
  }

  const setDecoder = isInstanceOf(Set);

  assertDecodeSuccess(setDecoder, set, { expected: set });

  for (const item of [{}, null, 0, undefined, 'str', map, array]) {
    assertDecodeErrors({
      decoder: setDecoder,
      input: item,
      expected: [
        {
          input: item,
          msg: expectedMsg(Set),
        },
      ],
      count,
    });  
  }

  const arrayDecoder = isInstanceOf(Array);

  assertDecodeSuccess(arrayDecoder, array, { expected: array });

  for (const item of [{}, null, 0, undefined, 'str', map, set]) {
    assertDecodeErrors({
      decoder: arrayDecoder,
      input: item,
      expected: [
        {
          input: item,
          msg: expectedMsg(Array),
        },
      ],
      count,
    });  
  }
});

runTests();
