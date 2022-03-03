import { Buffer, BufReader } from "../../io/buffer.ts";
import { defaultReadOptions, readRecord } from "./_io.ts";

function createTransformStream(
  options?: CSVStreamOptions,
): TransformStream<Uint8Array, Array<string>> {
  let lineIndex = 0;
  const buffer = new Buffer();
  const bufReader = BufReader.create(buffer);
  return new TransformStream<Uint8Array, Array<string>>({
    async transform(chunk, controller) {
      buffer.writeSync(chunk);
      while (!buffer.empty() || bufReader.buffered() > 0) {
        const record = await readRecord(lineIndex, bufReader, options);
        if (record === null && buffer.empty()) {
          controller.terminate();
          return;
        }

        lineIndex++;
        if (record && record.length > 0) {
          controller.enqueue(record);
        }
      }
    },
  });
}

export interface CSVStreamOptions {
  separator?: string;
  comment?: string;
}

export class CSVStream {
  #transform: TransformStream<Uint8Array, Array<string>>;

  constructor(options: CSVStreamOptions = defaultReadOptions) {
    this.#transform = createTransformStream({
      ...defaultReadOptions,
      ...options,
    });
  }

  get readable(): ReadableStream<Array<string>> {
    return this.#transform.readable;
  }

  get writable(): WritableStream<Uint8Array> {
    return this.#transform.writable;
  }
}
