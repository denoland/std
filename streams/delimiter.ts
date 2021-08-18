export class TextDelimiterStream extends TransformStream<string, string> {
  #buf: string = "";
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
