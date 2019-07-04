// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isInstanceOf } from './is_instance_of.ts';

/**
 * isInstanceOf()
 */

test(function initializes() {
  assertEquals(isInstanceOf(Map) instanceof Decoder, true);
  assertEquals(isInstanceOf(Array) instanceof Decoder, true);
  assertEquals(isInstanceOf(Set) instanceof Decoder, true);
});

test(function decodesInput() {
  const expectedMsg = (clazz: any) => `must be an instance of ${clazz.name}`;
  const length = 1;
  const map = new Map();
  const set = new Set();
  const array = [];

  const mapDecoder = isInstanceOf(Map);
  let msg = expectedMsg(Map);

  assertDecodeSuccess(mapDecoder, map, { expected: map });

  for (const item of [{}, null, 0, undefined, 'str', set, array]) {
    assertDecodeErrors({
      decoder: mapDecoder,
      input: item,
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const setDecoder = isInstanceOf(Set);
  msg = expectedMsg(Set);

  assertDecodeSuccess(setDecoder, set, { expected: set });

  for (const item of [{}, null, 0, undefined, 'str', map, array]) {
    assertDecodeErrors({
      decoder: setDecoder,
      input: item,
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const arrayDecoder = isInstanceOf(Array);
  msg = expectedMsg(Array);

  assertDecodeSuccess(arrayDecoder, array, { expected: array });

  for (const item of [{}, null, 0, undefined, 'str', map, set]) {
    assertDecodeErrors({
      decoder: arrayDecoder,
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
  const expectedMsg = (clazz: any) => `must be an instance of ${clazz.name}`;
  const length = 1;
  const map = new Map();
  const set = new Set();
  const array = [];

  const mapDecoder = isInstanceOf(Map);
  let msg = expectedMsg(Map);

  await assertDecodeSuccess(mapDecoder, Promise.resolve(map), { expected: map });

  for (const item of [{}, null, 0, undefined, 'str', set, array]) {
    await assertDecodeErrors({
      decoder: mapDecoder,
      input: Promise.resolve(item),
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const setDecoder = isInstanceOf(Set);
  msg = expectedMsg(Set);

  await assertDecodeSuccess(setDecoder, Promise.resolve(set), { expected: set });

  for (const item of [{}, null, 0, undefined, 'str', map, array]) {
    await assertDecodeErrors({
      decoder: setDecoder,
      input: Promise.resolve(item),
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }

  const arrayDecoder = isInstanceOf(Array);
  msg = expectedMsg(Array);

  await assertDecodeSuccess(arrayDecoder, Promise.resolve(array), { expected: array });

  for (const item of [{}, null, 0, undefined, 'str', map, set]) {
    await assertDecodeErrors({
      decoder: arrayDecoder,
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
