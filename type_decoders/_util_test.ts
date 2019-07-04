// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { DecoderError } from './decoder_result.ts';
import * as utils from './_util.ts';
import { assertDecoderSuccess, assertDecoderErrors } from './_testing_util.ts';

/**
 * _util
 */

test(function ok() {
  assertDecoderSuccess(utils.ok(null), { value: null });
  assertDecoderSuccess(utils.ok(undefined), { value: undefined });
  assertDecoderSuccess(utils.ok(10), { value: 10 });
  const obj = {};
  assertDecoderSuccess(utils.ok(obj), { value: obj });
});

test(function err() {
  assertDecoderErrors({
    errors: utils.err(null, 'null err', 'nullDecoder'),
    count: 1,
    expected: [
      {
        input: null,
        location: '',
        msg: 'null err',
        decoderName: 'nullDecoder',
      },
    ],
  });

  assertDecoderErrors({
    errors: utils.err('string', 'string err', 'stringDecoder', {
      allErrors: true,
      decoderName: 'customName',
      msg: 'newMessage',
    }),
    count: 1,
    expected: [
      {
        input: 'string',
        location: '',
        msg: 'newMessage',
        decoderName: 'customName',
        allErrors: true,
      },
    ],
  });

  assertDecoderErrors({
    errors: utils.err('string', 'string err', 'stringDecoder', {
      allErrors: true,
      decoderName: 'customName',
      msg: (errors) => [
        ...errors,
        new DecoderError(null, 'null'),
        new DecoderError(undefined, 'undefined'),
      ],
    }),
    count: 3,
    expected: [
      {
        input: 'string',
        msg: 'string err',
        decoderName: 'customName',
        location: '',
        allErrors: true,
      },
      {
        input: null,
        msg: 'null',
        decoderName: undefined,
        location: '',
        allErrors: false,
      },
      {
        input: undefined,
        msg: 'undefined',
        decoderName: undefined,
        location: '',
        allErrors: false,
      },
    ],
  });
});

test(function buildErrorLocationString() {
  assertEquals(
    utils.buildErrorLocationString(1, 'payload[1]'),
    '[1].payload[1]'
  )

  assertEquals(
    utils.buildErrorLocationString('value', 'payload[1]'),
    'value.payload[1]'
  )

  assertEquals(
    utils.buildErrorLocationString('value', '[1]'),
    'value[1]'
  )

  assertEquals(
    utils.buildErrorLocationString('val8ue', '[1]'),
    '["val8ue"][1]'
  )

  assertEquals(
    utils.buildErrorLocationString('Value', '[1]'),
    'Value[1]'
  )

  assertEquals(
    utils.buildErrorLocationString('type', 'Value[1]'),
    'type.Value[1]'
  )
});

runTests();
