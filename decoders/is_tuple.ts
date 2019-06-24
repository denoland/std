import { Decoder, PromiseDecoder } from './decoder.ts';
import { ok, err, NestedDecoderErrorMsg } from './utils.ts';
import { DecoderError, DecoderResult } from './decoder_result.ts';

export interface ITupleDecoderOptions {
  msg?: NestedDecoderErrorMsg;
}

export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: { [I in keyof Tuple]: Decoder<Tuple[I]> },
  args?: ITupleDecoderOptions,
): Decoder<Tuple>;
export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  args?: ITupleDecoderOptions,
): PromiseDecoder<Tuple>;
export function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  args: ITupleDecoderOptions = {},
) {
  const msg = args.msg || `must match the tuple`;

  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder(async input => {
      if (!Array.isArray(input)) return err(input, msg);
      else if (input.length !== decoders.length) return err(input, msg);

      const tuplePromises: any[] = decoders.map((decoder, index) =>
        decoder.decode(input[index]),
      );

      const tupleResult = await Promise.all(tuplePromises);

      return getTupleResult(tupleResult, msg);
    });
  }

  return new Decoder(input => {
    if (!Array.isArray(input)) return err(input, msg);
    else if (input.length !== decoders.length) return err(input, msg);

    const tupleResult: any[] = decoders.map((decoder, index) =>
      decoder.decode(input[index]),
    );

    return getTupleResult(tupleResult, msg);
  });
}

function getTupleResult<T>(
  results: DecoderResult<T>[],
  msg?: NestedDecoderErrorMsg,
) {
  const index = results.findIndex(result => result instanceof DecoderError);

  if (index >= 0) {
    const error = results[index] as DecoderError;

    return err(error.value, msg || error.message, {
      location: `[${index}]${error.location}`,
      child: error,
      key: index,
    });
  }

  return ok(results.map(result => result.value));
}
