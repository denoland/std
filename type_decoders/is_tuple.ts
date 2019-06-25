import { Decoder, PromiseDecoder } from "./decoder.ts";
import { ok, err, buildErrorLocationString } from "./util.ts";
import {
  DecoderError,
  DecoderResult,
  DecoderErrorMsgArg
} from "./decoder_result.ts";

const decoderName = "isTuple";

export interface ITupleDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: { [I in keyof Tuple]: Decoder<Tuple[I]> },
  options?: ITupleDecoderOptions
): Decoder<Tuple>;
export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  options?: ITupleDecoderOptions
): PromiseDecoder<Tuple>;
export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  options: ITupleDecoderOptions = {}
) {
  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder(async input => {
      if (!Array.isArray(input)) {
        return err(input, "must be an array", options.msg, { decoderName });
      } else if (input.length !== decoders.length) {
        return err(
          input,
          `array must be length ${decoders.length}`,
          options.msg,
          { decoderName }
        );
      }

      const tuplePromises: any[] = decoders.map((decoder, index) =>
        decoder.decode(input[index])
      );

      const tupleResult = await Promise.all(tuplePromises);

      return getTupleResult(tupleResult, options.msg);
    });
  }

  return new Decoder(input => {
    if (!Array.isArray(input)) {
      return err(input, "must be an array", options.msg, { decoderName });
    } else if (input.length !== decoders.length) {
      return err(
        input,
        `array must be length ${decoders.length}`,
        options.msg,
        { decoderName }
      );
    }

    const tupleResult: any[] = decoders.map((decoder, index) =>
      decoder.decode(input[index])
    );

    return getTupleResult(tupleResult, options.msg);
  });
}

function getTupleResult<T>(
  results: DecoderResult<T>[],
  providedMsg?: DecoderErrorMsgArg
) {
  const index = results.findIndex(result => result instanceof DecoderError);

  if (index >= 0) {
    const error = results[index] as DecoderError;
    const location = buildErrorLocationString(index, error.location);

    return err(
      error.value,
      `invalid array element [${index}] > ${error.message}`,
      providedMsg,
      {
        decoderName,
        child: error,
        location,
        key: index
      }
    );
  }

  return ok(results.map(result => result.value));
}
