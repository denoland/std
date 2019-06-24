import { Decoder } from './decoder';
import { DecoderError } from './decoder_result';

export function assert<R, V>(decoder: Decoder<R, V>) {
  return (value: V) => {
    const result = decoder.decode(value);

    if (result instanceof DecoderError) throw result;

    return result.value;
  };
}
