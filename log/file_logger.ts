import { BufWriterSync } from "../io/buffer.ts";
import { Logger } from "./logger.ts";

const encoder = new TextEncoder();

export class FileLogger<D extends unknown[] = unknown[]> extends Logger<D> {
  #file?: Deno.FsFile;
  #buf?: BufWriterSync;
  constructor(
    logLevel: number,
    filename: string,
    options: Deno.OpenOptions = {},
  ) {
    super(logLevel);
    this.open(filename, options);
  }
  #unloadCallback() {
    this.close();
  }
  open(filename: string, options: Deno.OpenOptions) {
    this.#file = Deno.openSync(filename, {
      create: true,
      ...options,
      write: true,
    });
    this.#buf = new BufWriterSync(this.#file);
    addEventListener("unload", this.#unloadCallback);
  }
  close() {
    this.#buf?.flush();
    this.#buf = undefined;
    this.#file?.close();
    this.#file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }

  protected handler(data: D, _logLevel?: number) {
    this.#buf?.writeSync(encoder.encode(`${data}\n`));
  }
}
