import {
  DecoderError,
  DecoderErrorMsgArg,
  DecoderResult,
  DecoderSuccess,
  areDecoderErrors,
} from './decoder_result.ts';

export interface SimpleDecoderOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

export interface ComposeDecoderOptions extends SimpleDecoderOptions {
  allErrors?: boolean;
}

export function applyOptionsToDecoderErrors(
  errors: DecoderError[],
  options: ComposeDecoderOptions | undefined,
): DecoderError[] {
  if (!options) return errors;

  if (options.allErrors && options.decoderName) {
    errors.forEach(
      (err): void => {
        err.allErrors = true;
        err.decoderName = options.decoderName;
      },
    );
  } else if (options.allErrors) {
    errors.forEach(
      (err): void => {
        err.allErrors = true;
      },
    );
  } else if (options.decoderName) {
    errors.forEach(
      (err): void => {
        err.decoderName = options.decoderName;
      },
    );
  }

  if (!options.msg) return errors;

  const newErrors =
    typeof options.msg === 'function'
      ? options.msg(errors)
      : errors.map(
          (error): DecoderError => {
            error.message = options.msg as string;
            return error;
          },
        );

  if (newErrors.length === 0) {
    throw new Error(
      'Provided DecoderError function must return ' +
        'an array of DecoderError with length greater than 0.',
    );
  }

  return newErrors;
}

async function _raceToDecoderSuccess<T>(
  promises: Array<Promise<DecoderResult<T>>>,
  errors: DecoderError[] = [],
): Promise<DecoderSuccess<T> | DecoderError[]> {
  if (promises.length === 0) return errors;

  const indexedPromises = promises.map(
    (promise, index): Promise<[number, DecoderResult<T>]> =>
      promise.then((value): [number, DecoderResult<T>] => [index, value]),
  );

  const res = await Promise.race(indexedPromises);

  if (areDecoderErrors(res[1])) {
    promises.splice(res[0], 1);

    errors.push(...(res[1] as DecoderError[]));

    return _raceToDecoderSuccess(promises, errors);
  }

  return res[1];
}

export function raceToDecoderSuccess<T>(
  promises: Array<Promise<DecoderResult<T>>>,
): Promise<DecoderSuccess<T> | DecoderError[]> {
  return _raceToDecoderSuccess(promises);
}
