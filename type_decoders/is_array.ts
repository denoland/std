import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError, DecoderResult } from './decoder_result.ts';
import {
  err,
  NestedDecoderErrorMsg,
  ok,
  buildErrorLocationString,
} from './util.ts';

const decoderName = 'isArray';

export interface IArrayDecoderOptions<V> {
  msg?: NestedDecoderErrorMsg<V>;
}

export function isArray<R = unknown, V = unknown>(
  options?: IArrayDecoderOptions<V>,
): Decoder<R[], V>;

export function isArray<R, V = unknown>(
  decoder: Decoder<R, V>,
  options?: IArrayDecoderOptions<V>,
): Decoder<R[], V>;

export function isArray<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  options?: IArrayDecoderOptions<V>,
): PromiseDecoder<R[], V>;

export function isArray<R, V = unknown>(
  decoder?: Decoder<R, V> | PromiseDecoder<R, V> | IArrayDecoderOptions<V>,
  options?: IArrayDecoderOptions<V>,
) {
  if (!(decoder instanceof Decoder || decoder instanceof PromiseDecoder)) {
    return new Decoder<R[], V>((input: V) =>
      Array.isArray(input)
        ? ok<R[]>(input.slice())
        : err(input, (decoder && decoder.msg) || 'must be an array', {
            decoderName,
          }),
    );
  }

  if (decoder instanceof Decoder) {
    return new Decoder((input: V) => {
      if (!Array.isArray(input))
        return err(input, (options && options.msg) || 'must be an array', {
          decoderName,
        });

      const elements: R[] = [];
      let index = 0;

      for (const el of input) {
        const result = decoder.decode(el);

        const error = handleResult(result, index, input, elements, options.msg);

        if (error instanceof DecoderError) return error;
      }

      return ok(elements);
    });
  }

  return new PromiseDecoder(async (input: V) => {
    if (!Array.isArray(input))
      return err(input, (options && options.msg) || 'must be an array', {
        decoderName,
      });

    const elements: R[] = [];
    let index = 0;

    for (const el of input) {
      const result = await decoder.decode(el);

      const error = handleResult(result, index, input, elements, options.msg);

      if (error instanceof DecoderError) return error;
    }

    return ok(elements);
  });
}

function handleResult<T>(
  result: DecoderResult<T>,
  index: number,
  input: unknown,
  elements: unknown[],
  providedMsg?: NestedDecoderErrorMsg,
) {
  if (result instanceof DecoderError) {
    const msg =
      providedMsg || `invalid array element [${index}] > ${result.message}`;

    const location = buildErrorLocationString(index, result.location);

    return err(input, msg, {
      decoderName,
      child: result,
      location,
      key: index,
    });
  }

  elements.push(result.value);
  index++;
}
