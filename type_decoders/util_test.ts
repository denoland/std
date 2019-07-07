// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";
import * as helpers from "./util.ts";
import {
  assertDecoderErrors,
  assertAsyncDecoderSuccess,
  assertAsyncDecoderErrors
} from "./test_util.ts";

function decoderErrors(): {
  nullValue: null;
  yesValue: "yes";
  payloadValue: {};
  objValue: { payload: {} };
  errors: DecoderError[];
} {
  const nullValue = null;
  const yesValue = "yes";
  const payloadValue = {};
  const objValue = { payload: payloadValue };

  return {
    nullValue,
    yesValue,
    payloadValue,
    objValue,
    errors: [
      new DecoderError(nullValue, "null error", {
        decoderName: "nullDecoder",
        allErrors: true
      }),
      new DecoderError(yesValue, "must be a boolean", {
        decoderName: "booleanDecoder"
      }),
      new DecoderError(
        objValue,
        'invalid value for key ["payload"] > must be a string',
        {
          decoderName: "objectDecoder",
          child: new DecoderError(payloadValue, "must be a string", {
            decoderName: "stringDecoder"
          }),
          key: "payload",
          location: "payload"
        }
      )
    ]
  };
}

/**
 * helpers
 */

test(function applyOptionsToDecoderErrors(): void {
  /**
   * 1. test with { allErrors: true } option
   */

  let args = decoderErrors();

  let errors = helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true
  });

  assertDecoderErrors(errors, [
    new DecoderError(args.nullValue, "null error", {
      decoderName: "nullDecoder",
      allErrors: true,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.yesValue, "must be a boolean", {
      decoderName: "booleanDecoder",
      allErrors: true,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(
      args.objValue,
      'invalid value for key ["payload"] > must be a string',
      {
        decoderName: "objectDecoder",
        allErrors: true,
        location: "payload",
        key: "payload",
        child: new DecoderError(args.payloadValue, "must be a string", {
          decoderName: "stringDecoder",
          allErrors: false,
          location: "",
          key: undefined,
          child: undefined
        })
      }
    )
  ]);

  // /**
  //  * 2. test with { decoderName: string } option
  //  */

  args = decoderErrors();

  errors = helpers.applyOptionsToDecoderErrors(args.errors, {
    decoderName: "customDecoderName"
  });

  assertDecoderErrors(errors, [
    new DecoderError(args.nullValue, "null error", {
      decoderName: "customDecoderName",
      allErrors: true,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.yesValue, "must be a boolean", {
      decoderName: "customDecoderName",
      allErrors: false,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(
      args.objValue,
      'invalid value for key ["payload"] > must be a string',
      {
        decoderName: "customDecoderName",
        allErrors: false,
        location: "payload",
        key: "payload",
        child: new DecoderError(args.payloadValue, "must be a string", {
          decoderName: "stringDecoder",
          allErrors: false,
          location: "",
          key: undefined,
          child: undefined
        })
      }
    )
  ]);

  /**
   * 3. test with { msg: string } option
   */

  args = decoderErrors();

  errors = helpers.applyOptionsToDecoderErrors(args.errors, {
    msg: "my custom error message"
  });

  assertDecoderErrors(errors, [
    new DecoderError(args.nullValue, "my custom error message", {
      decoderName: "nullDecoder",
      allErrors: true,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.yesValue, "my custom error message", {
      decoderName: "booleanDecoder",
      allErrors: false,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.objValue, "my custom error message", {
      decoderName: "objectDecoder",
      allErrors: false,
      location: "payload",
      key: "payload",
      child: new DecoderError(args.payloadValue, "must be a string", {
        decoderName: "stringDecoder",
        allErrors: false,
        location: "",
        key: undefined,
        child: undefined
      })
    })
  ]);

  /**
   * 4. test with { allErrors: true, decoderName: string, msg: string } options
   */

  args = decoderErrors();

  errors = helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true,
    decoderName: "customDecoderName",
    msg: "my custom error message"
  });

  assertDecoderErrors(errors, [
    new DecoderError(args.nullValue, "my custom error message", {
      decoderName: "customDecoderName",
      allErrors: true,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.yesValue, "my custom error message", {
      decoderName: "customDecoderName",
      allErrors: true,
      location: "",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.objValue, "my custom error message", {
      decoderName: "customDecoderName",
      allErrors: true,
      location: "payload",
      key: "payload",
      child: new DecoderError(args.payloadValue, "must be a string", {
        decoderName: "stringDecoder",
        allErrors: false,
        location: "",
        key: undefined,
        child: undefined
      })
    })
  ]);

  /**
   * 5. test with { allErrors: true, decoderName: string, msg: fn } options
   */

  args = decoderErrors();

  const mutateErrors = (errors: DecoderError[]): DecoderError[] => {
    errors.forEach(
      (error): void => {
        error.location = "funky location";
      }
    );

    return errors;
  };

  errors = helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true,
    decoderName: "customDecoderName",
    msg: mutateErrors
  });

  assertDecoderErrors(errors, [
    new DecoderError(args.nullValue, "null error", {
      decoderName: "customDecoderName",
      allErrors: true,
      location: "funky location",
      key: undefined,
      child: undefined
    }),
    new DecoderError(args.yesValue, "must be a boolean", {
      decoderName: "customDecoderName",
      allErrors: true,
      location: "funky location",
      key: undefined,
      child: undefined
    }),
    new DecoderError(
      args.objValue,
      'invalid value for key ["payload"] > must be a string',
      {
        decoderName: "customDecoderName",
        allErrors: true,
        location: "funky location",
        key: "payload",
        child: new DecoderError(args.payloadValue, "must be a string", {
          decoderName: "stringDecoder",
          allErrors: false,
          location: "",
          key: undefined,
          child: undefined
        })
      }
    )
  ]);

  /**
   * 6. test with { allErrors: true, decoderName: string, msg: fn } options
   */

  args = decoderErrors();

  const replaceErrors = (errors: DecoderError[]): DecoderError[] => {
    return errors.map(
      (error): DecoderError =>
        new DecoderError(error.input, error.message, {
          decoderName: "myDecoder",
          child: error.child
        })
    );
  };

  errors = helpers.applyOptionsToDecoderErrors(args.errors, {
    allErrors: true,
    decoderName: "customDecoderName",
    msg: replaceErrors
  });

  assertDecoderErrors(errors, [
    new DecoderError(args.nullValue, "null error", {
      decoderName: "myDecoder",
      child: undefined
    }),
    new DecoderError(args.yesValue, "must be a boolean", {
      decoderName: "myDecoder",
      child: undefined
    }),
    new DecoderError(
      args.objValue,
      'invalid value for key ["payload"] > must be a string',
      {
        decoderName: "myDecoder",
        child: new DecoderError(args.payloadValue, "must be a string", {
          decoderName: "stringDecoder",
          allErrors: false,
          location: "",
          key: undefined,
          child: undefined
        })
      }
    )
  ]);
});

test(async function raceToDecoderSuccess(): Promise<void> {
  const decoderSuccess = (ms: number): Promise<DecoderSuccess<number>> =>
    new Promise<DecoderSuccess<number>>(
      (res): void => {
        setTimeout((): void => res(new DecoderSuccess(ms)), ms);
      }
    );

  const decoderError = (ms: number): Promise<DecoderError[]> =>
    new Promise<DecoderError[]>(
      (res): void => {
        setTimeout((): void => res([new DecoderError(ms, `${ms}`)]), ms);
      }
    );

  const testSuccessRace = async (
    promises: Array<Promise<DecoderResult<unknown>>>,
    time: number,
    success: DecoderSuccess<unknown>
  ): Promise<void> => {
    const start = performance.now();

    assertAsyncDecoderSuccess(helpers.raceToDecoderSuccess(promises), success);

    const end = performance.now();

    assertEquals(
      end - start <= time,
      true,
      `expected to take less than ${time}ms but took ${end - start}ms`
    );
  };

  const testErrorRace = async (
    promises: Array<Promise<DecoderResult<unknown>>>,
    time: number,
    errors: DecoderError[]
  ): Promise<void> => {
    const start = performance.now();

    assertAsyncDecoderErrors(helpers.raceToDecoderSuccess(promises), errors);

    const end = performance.now();

    assertEquals(
      end - start <= time,
      true,
      `expected to take less than ${time}ms but took ${end - start}ms`
    );
  };

  await Promise.all([
    testSuccessRace(
      [decoderSuccess(20), decoderError(10), decoderError(30)],
      29,
      new DecoderSuccess(20)
    ),
    testSuccessRace(
      [decoderError(10), decoderSuccess(20), decoderError(30)],
      29,
      new DecoderSuccess(20)
    ),
    testSuccessRace(
      [decoderError(10), decoderError(30), decoderSuccess(20)],
      29,
      new DecoderSuccess(20)
    ),
    testSuccessRace(
      [decoderError(10), decoderSuccess(20), decoderSuccess(30)],
      29,
      new DecoderSuccess(20)
    ),
    testSuccessRace(
      [decoderSuccess(10), decoderSuccess(20), decoderSuccess(30)],
      19,
      new DecoderSuccess(10)
    ),
    testSuccessRace(
      [decoderSuccess(20), decoderSuccess(20), decoderSuccess(20)],
      29,
      new DecoderSuccess(20)
    ),
    testErrorRace([decoderError(10), decoderError(20), decoderError(30)], 39, [
      new DecoderError(10, "10"),
      new DecoderError(20, "20"),
      new DecoderError(30, "30")
    ]),
    testErrorRace(
      [
        decoderError(10),
        decoderError(20),
        decoderError(30),
        decoderError(40),
        decoderError(40)
      ],
      49,
      [
        new DecoderError(10, "10"),
        new DecoderError(20, "20"),
        new DecoderError(30, "30"),
        new DecoderError(40, "40"),
        new DecoderError(40, "40")
      ]
    )
  ]);
});

runTests();
