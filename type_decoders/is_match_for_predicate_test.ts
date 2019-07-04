// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder, assertPromiseDecoder } from './testing_asserts.ts';
import { Decoder, PromiseDecoder } from './decoder.ts';
import { isMatchForPredicate } from './is_match_for_predicate.ts';

/**
 * isMatchForPredicate()
 */

test(function initializes() {
  assertDecoder(isMatchForPredicate(value => true));
  assertDecoder(isMatchForPredicate(value => true));
  
  assertPromiseDecoder(isMatchForPredicate(value => false, { promise: true }));
  assertPromiseDecoder(isMatchForPredicate(value => Promise.resolve(false), { promise: true }));
});

test(function decodesInput() {
  const decoder1 = isMatchForPredicate(value => typeof value === 'string');
  const msg = 'failed custom check';
  const count = 1;

  for (const item of ['0', 'two']) {
    assertDecodeSuccess(decoder1, item, { expected: item }); 
  }

  for (const item of [0.123, true, {}, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: [
        {
          input: item,
          msg,
        },
      ],
      count,
    });
  }

  const decoder3 = isMatchForPredicate<number>(value => value > 10);

  for (const item of [12, 100, 10.3232]) {
    assertDecodeSuccess(decoder3, item, { expected: item }); 
  }

  for (const item of [0.123, -12, -100, 4, 9.999]) {
    assertDecodeErrors({
      decoder: decoder3,
      input: item,
      expected: [
        {
          input: item,
          msg,
        },
      ],
      count,
    });  
  }
});

test(async function promiseDecodesInput() {
  const decoder1 = isMatchForPredicate(value => typeof value === 'string', { promise: true });
  const msg = 'failed custom check';
  const count = 1;

  for (const item of ['0', 'two']) {
    await assertDecodeSuccess(decoder1, item, { expected: item }); 
  }

  for (const item of [0.123, true, {}, null, undefined]) {
    await assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: [
        {
          input: item,
          msg,
        },
      ],
      count,
    });  
  }

  const decoder3 = isMatchForPredicate<number>(value => Promise.resolve(value > 10), { promise: true });

  for (const item of [12, 100, 10.3232]) {
    await assertDecodeSuccess(decoder3, item, { expected: item }); 
  }

  for (const item of [0.123, -12, -100, 4, 9.999]) {
    await assertDecodeErrors({
      decoder: decoder3,
      input: item,
      expected: [
        {
          input: item,
          msg,
        },
      ],
      count,
    });  
  }
});

runTests();
