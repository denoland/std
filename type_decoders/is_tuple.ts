import { Decoder, PromiseDecoder } from './decoder.ts';
import {
  ok,
  err,
  NestedDecoderErrorMsg,
  buildErrorLocationString,
} from './util.ts';
import { DecoderError, DecoderResult } from './decoder_result.ts';

export interface ITupleDecoderOptions {
  msg?: NestedDecoderErrorMsg;
}

export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: { [I in keyof Tuple]: Decoder<Tuple[I]> },
  options?: ITupleDecoderOptions,
): Decoder<Tuple>;
export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  options?: ITupleDecoderOptions,
): PromiseDecoder<Tuple>;
export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  options: ITupleDecoderOptions = {},
) {
  const decoderName = 'isTuple';

  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder(async input => {
      if (!Array.isArray(input)) {
        return err(input, options.msg || 'must be an array', { decoderName });
      } else if (input.length !== decoders.length) {
        return err(
          input,
          options.msg || `array must be length ${decoders.length}`,
          { decoderName },
        );
      }

      const tuplePromises: any[] = decoders.map((decoder, index) =>
        decoder.decode(input[index]),
      );

      const tupleResult = await Promise.all(tuplePromises);

      return getTupleResult(tupleResult, options.msg);
    });
  }

  return new Decoder(input => {
    if (!Array.isArray(input)) {
      return err(input, options.msg || 'must be an array', { decoderName });
    } else if (input.length !== decoders.length) {
      return err(
        input,
        options.msg || `array must be length ${decoders.length}`,
        { decoderName },
      );
    }

    const tupleResult: any[] = decoders.map((decoder, index) =>
      decoder.decode(input[index]),
    );

    return getTupleResult(tupleResult, options.msg);
  });
}

function getTupleResult<T>(
  results: DecoderResult<T>[],
  providedMsg?: NestedDecoderErrorMsg,
) {
  const index = results.findIndex(result => result instanceof DecoderError);

  if (index >= 0) {
    const error = results[index] as DecoderError;
    const msg =
      providedMsg || `invalid array element [${index}] > ${error.message}`;
    const location = buildErrorLocationString(index, error.location);

    return err(error.value, msg, {
      decoderName: 'isTuple',
      child: error,
      location,
      key: index,
    });
  }

  return ok(results.map(result => result.value));
}
