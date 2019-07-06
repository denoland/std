import {
  DecoderError,
  DecoderErrorMsgArg,
  DecoderResult,
  DecoderSuccess,
  areDecoderErrors
} from "./decoder_result.ts";

export interface ISimpleDecoderOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

export interface IComposeDecoderOptions extends ISimpleDecoderOptions {
  allErrors?: boolean;
}

export function applyOptionsToDecoderErrors(
  errors: DecoderError[],
  options: IComposeDecoderOptions | undefined
) {
  if (!options) return errors;

  if (options.allErrors && options.decoderName) {
    errors.forEach(err => {
      err.allErrors = true;
      err.decoderName = options.decoderName;
    });
  } else if (options.allErrors) {
    errors.forEach(err => {
      err.allErrors = true;
    });
  } else if (options.decoderName) {
    errors.forEach(err => {
      err.decoderName = options.decoderName;
    });
  }

  if (!options.msg) return errors;

  const newErrors =
    typeof options.msg === "function"
      ? options.msg(errors)
      : errors.map(error => {
          error.message = options.msg as string;
          return error;
        });

  if (newErrors.length === 0) {
    throw new Error(
      "Provided DecoderError function must return " +
        "an array of DecoderError with length greater than 0."
    );
  }

  return newErrors;
}

export function raceToDecoderSuccess<T>(
  promises: Promise<DecoderResult<T>>[]
): Promise<DecoderSuccess<T> | DecoderError[]> {
  return _raceToDecoderSuccess(promises);
}

async function _raceToDecoderSuccess<T>(
  promises: Promise<DecoderResult<T>>[],
  errors: DecoderError[] = []
): Promise<DecoderSuccess<T> | DecoderError[]> {
  if (promises.length === 0) return errors;

  const indexedPromises = promises.map((promise, index) =>
    promise.then(value => [index, value] as [number, DecoderResult<T>])
  );

  const res = await Promise.race(indexedPromises);

  if (areDecoderErrors(res[1])) {
    promises.splice(res[0], 1);

    errors.push(...(res[1] as DecoderError[]));

    return _raceToDecoderSuccess(promises, errors);
  }

  return res[1];
}
