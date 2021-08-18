const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);

export class LineStream extends TransformStream<Uint8Array, Uint8Array> {
  #bufs: Uint8Array[] = [];

  constructor() {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#mergeBufs());
      },
    });
  }

  #handle(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    const lfIndex = chunk.indexOf(LF);
    if (lfIndex === -1) {
      this.#bufs.push(chunk);
    } else {
      let crOrLfIndex = lfIndex;
      if (chunk[lfIndex - 1] === CR) {
        crOrLfIndex--;
      }
      this.#bufs.push(chunk.subarray(0, crOrLfIndex));
      controller.enqueue(this.#mergeBufs());
      this.#bufs = [];
      this.#handle(chunk.subarray(lfIndex + 1), controller);
    }
  }

  #mergeBufs(): Uint8Array {
    const mergeBuf = new Uint8Array(
      this.#bufs.reduce((acc, buf) => acc + buf.length, 0),
    );
    let offset = 0;
    for (const buf of this.#bufs) {
      mergeBuf.set(buf, offset);
      offset += buf.length;
    }
    return mergeBuf;
  }
}

export class TextDelimiterStream extends TransformStream<string, string> {
  #buf = "";
  #delimiter: string;

  constructor(delimiter: string) {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#buf);
      },
    });

    this.#delimiter = delimiter;
  }

  #handle(chunk: string, controller: TransformStreamDefaultController<string>) {
    const lfIndex = chunk.indexOf(this.#delimiter);
    if (lfIndex === -1) {
      this.#buf += chunk;
    } else {
      this.#buf += chunk.slice(0, lfIndex);
      controller.enqueue(this.#buf);
      this.#buf = "";
      this.#handle(chunk.slice(lfIndex + this.#delimiter.length), controller);
    }
  }
}
