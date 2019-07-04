// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import * as helpers from './helpers.ts';
import { DecoderError } from './decoder_result.ts';

function decoderErrors() {
  const nullValue = null;
  const yesValue = 'yes';
  const payloadValue = {};
  const objValue = { payload: payloadValue };

  return {
    nullValue,
    yesValue,
    payloadValue,
    objValue,
    errors: [
      new DecoderError(nullValue, 'null error', {
        decoderName: 'nullDecoder',
        allErrors: true,
      }),
      new DecoderError(yesValue, 'must be a boolean', {
        decoderName: 'booleanDecoder',
      }),
      new DecoderError(
        objValue,
        'invalid value for key ["payload"] > must be a string',
        {
          decoderName: 'objectDecoder',
          child: new DecoderError(payloadValue, 'must be a string', {
            decoderName: 'stringDecoder',
          }),
          key: 'payload',
          location: 'payload',
        },
      ),
    ],
  };
}

/**
 * helpers
 */

test(function applyOptionsToDecoderErrors() {
  let args = decoderErrors();

  /** 
   * 1. make sure test is properly set up
   */

  assertEquals(args.errors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'null error',
      decoderName: 'nullDecoder',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'must be a boolean',
      decoderName: 'booleanDecoder',
      allErrors: false,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'invalid value for key ["payload"] > must be a string',
      decoderName: 'objectDecoder',
      allErrors: false,
      location: 'payload',
      key: 'payload',
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);

  /** 
   * 2. test with { allErrors: true } option
   */

  args = decoderErrors();

  helpers.applyOptionsToDecoderErrors(args.errors, { allErrors: true });

  assertEquals(args.errors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'null error',
      decoderName: 'nullDecoder',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'must be a boolean',
      decoderName: 'booleanDecoder',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'invalid value for key ["payload"] > must be a string',
      decoderName: 'objectDecoder',
      allErrors: true,
      location: 'payload',
      key: 'payload',
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);

  /** 
   * 3. test with { decoderName: string } option
   */

  args = decoderErrors();

  helpers.applyOptionsToDecoderErrors(args.errors, {
    decoderName: 'customDecoderName',
  });

  assertEquals(args.errors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'null error',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'must be a boolean',
      decoderName: 'customDecoderName',
      allErrors: false,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'invalid value for key ["payload"] > must be a string',
      decoderName: 'customDecoderName',
      allErrors: false,
      location: 'payload',
      key: 'payload',
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);

  /** 
   * 4. test with { msg: string } option
   */

  args = decoderErrors();

  helpers.applyOptionsToDecoderErrors(args.errors, {
    msg: 'my custom error message',
  });

  assertEquals(args.errors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'my custom error message',
      decoderName: 'nullDecoder',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'my custom error message',
      decoderName: 'booleanDecoder',
      allErrors: false,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'my custom error message',
      decoderName: 'objectDecoder',
      allErrors: false,
      location: 'payload',
      key: 'payload',
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);

  /** 
   * 5. test with { allErrors: true, decoderName: string, msg: string } options
   */

  args = decoderErrors();

  helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true,
    decoderName: 'customDecoderName',
    msg: 'my custom error message',
  });

  assertEquals(args.errors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'my custom error message',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'my custom error message',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'my custom error message',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: 'payload',
      key: 'payload',
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);

  /** 
   * 6. test with { allErrors: true, decoderName: string, msg: fn } options
   */

  args = decoderErrors();

  const mutateErrors = (errors: DecoderError[]) => {
    errors.forEach(error => {
      error.location = 'funky location';
    });

    return errors;
  };

  helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true,
    decoderName: 'customDecoderName',
    msg: mutateErrors,
  });

  assertEquals(args.errors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'null error',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: 'funky location',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'must be a boolean',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: 'funky location',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'invalid value for key ["payload"] > must be a string',
      decoderName: 'customDecoderName',
      allErrors: true,
      location: 'funky location',
      key: 'payload',
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);

  /** 
   * 7. test with { allErrors: true, decoderName: string, msg: fn } options
   */

  args = decoderErrors();

  const replaceErrors = (errors: DecoderError[]) => {
    return errors.map(
      error =>
        new DecoderError(error.input, error.message, {
          decoderName: 'myDecoder',
          child: error.child,
        }),
    );
  };

  const newErrors = helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true,
    decoderName: 'customDecoderName',
    msg: replaceErrors,
  });

  assertEquals(newErrors, [
    {
      name: 'DecoderError',
      input: args.nullValue,
      message: 'null error',
      decoderName: 'myDecoder',
      allErrors: false,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.yesValue,
      message: 'must be a boolean',
      decoderName: 'myDecoder',
      allErrors: false,
      location: '',
      key: undefined,
      child: undefined,
    },
    {
      name: 'DecoderError',
      input: args.objValue,
      message: 'invalid value for key ["payload"] > must be a string',
      decoderName: 'myDecoder',
      allErrors: false,
      location: '',
      key: undefined,
      child: {
        name: 'DecoderError',
        input: args.payloadValue,
        message: 'must be a string',
        decoderName: 'stringDecoder',
        allErrors: false,
        location: '',
        key: undefined,
        child: undefined,
      },
    },
  ]);
});

runTests();
