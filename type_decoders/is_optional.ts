import { Decoder, PromiseDecoder } from './decoder.ts';
import { isExactly } from './is_exactly.ts';
import { ISimpleDecoderOptions, applyOptionsToDecoderErrors } from './helpers.ts';
import { isDecoderSuccess, DecoderError } from './decoder_result.ts';

const decoderName = 'isOptional';
const undefinedDecoder = isExactly(undefined);

export interface IOptionalDecoderOptions extends ISimpleDecoderOptions {}

export function isOptional<T>(
  decoder: Decoder<T>,
  options?: IOptionalDecoderOptions,
): Decoder<T | undefined>;
export function isOptional<T>(
  decoder: PromiseDecoder<T>,
  options?: IOptionalDecoderOptions,
): PromiseDecoder<T | undefined>;
export function isOptional<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IOptionalDecoderOptions = {},
) {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(async value => {  
      let result = undefinedDecoder.decode(value);
  
      if (isDecoderSuccess(result)) return result;
  
      result = await decoder.decode(value);
  
      if (isDecoderSuccess(result)) return result;
  
      return applyOptionsToDecoderErrors(
        result.map(error => 
          new DecoderError(
            value,
            `${error.message} OR must be undefined`,
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

    result = decoder.decode(value);

    if (isDecoderSuccess(result)) return result;

    return applyOptionsToDecoderErrors(
      result.map(error => 
        new DecoderError(
          value,
          `${error.message} OR must be undefined`,
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
