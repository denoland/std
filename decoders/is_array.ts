import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError } from './decoder_result.ts';
import { err, DecoderErrorMsg, ok } from './utils.ts';

export interface IArrayDecoderOptions<V> {
  msg?: DecoderErrorMsg<V>;
}
export function isArray<R = unknown, V = unknown>(
  args?: IArrayDecoderOptions<V>,
): Decoder<R[], V>;
export function isArray<R, V = unknown>(
  decoder: Decoder<R, V>,
  args?: IArrayDecoderOptions<V>,
): Decoder<R[], V>;
export function isArray<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  args?: IArrayDecoderOptions<V>,
): PromiseDecoder<R[], V>;
export function isArray<R, V = unknown>(
  decoder?: Decoder<R, V> | PromiseDecoder<R, V> | IArrayDecoderOptions<V>,
  args?: IArrayDecoderOptions<V>,
) {
  if (!(decoder instanceof Decoder || decoder instanceof PromiseDecoder)) {
    const msg =
      (decoder && decoder.msg) || 'must be an array of {{msg}} elements';

    return new Decoder<R[], V>((input: V) =>
      Array.isArray(input) ? ok<R[]>(input.slice()) : err(input, msg),
    );
  }

  const msg = (args && args.msg) || 'must be an array of {{msg}} elements';

  if (decoder instanceof Decoder) {
    return new Decoder((input: V) => {
      if (!Array.isArray(input)) return err(input, msg);

      const elements: R[] = [];
      let index = 0;

      for (const el of input) {
        const result = decoder.decode(el);

        if (result instanceof DecoderError) {
          return err(input, msg, {
            child: result,
            location: `[${index}]${result.location}`,
            key: index,
          });
        }

        elements.push(result.value);
        index++;
      }

      return ok(elements);
    });
  }

  return new PromiseDecoder(async (input: V) => {
    if (!Array.isArray(input)) return err(input, msg);

    const elements: R[] = [];
    let index = 0;

    for (const el of input) {
      const result = await decoder.decode(el);

      if (result instanceof DecoderError) {
        return err(input, msg, {
          child: result,
          location: `[${index}]${result.location}`,
          key: index,
        });
      }

      elements.push(result.value);
      index++;
    }

    return ok(elements);
  });
}
