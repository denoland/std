import { Decoder, PromiseDecoder } from './decoder.ts';
import { isExactly } from './is_exactly.ts';
import { ISimpleDecoderOptions, applyOptionsToDecoderErrors } from './helpers.ts';
import { DecoderError, isDecoderSuccess } from './decoder_result.ts';

const decoderName = 'isMaybe';
const undefinedDecoder = isExactly(undefined);
const nullDecoder = isExactly(null);

export interface IMaybeDecoderOptions extends ISimpleDecoderOptions {}

export function isMaybe<T>(
  decoder: Decoder<T>,
  options?: IMaybeDecoderOptions,
): Decoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: PromiseDecoder<T>,
  options?: IMaybeDecoderOptions,
): PromiseDecoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IMaybeDecoderOptions = {},
) {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(async value => {
      let result = undefinedDecoder.decode(value);

      if (isDecoderSuccess(result)) return result;
  
      result = nullDecoder.decode(value);
  
      if (isDecoderSuccess(result)) return result;
  
      result = await decoder.decode(value);
  
      if (isDecoderSuccess(result)) return result;
  
      return applyOptionsToDecoderErrors(
        result.map(error => 
          new DecoderError(
            value,
            `${error.message} OR must be null OR must be undefined`,
            {
              child: error,
              decoderName,
            }
          )
        ),
        options
      )
    })
  }

  return new Decoder(value => {
    let result = undefinedDecoder.decode(value);

    if (isDecoderSuccess(result)) return result;

    result = nullDecoder.decode(value);

    if (isDecoderSuccess(result)) return result;

    result = decoder.decode(value);

    if (isDecoderSuccess(result)) return result;

    return applyOptionsToDecoderErrors(
      result.map(error => 
        new DecoderError(
          value,
          `${error.message} OR must be null OR must be undefined`,
          {
            child: error,
            decoderName,
          }
        )
      ),
      options
    )
  })
}
