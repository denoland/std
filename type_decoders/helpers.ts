import { DecoderError, DecoderErrorMsgArg } from "./decoder_result.ts";

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
