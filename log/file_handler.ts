// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { LevelName, LogLevels } from "./levels.ts";
import type { LogRecord } from "./logger.ts";
import { BaseHandler, type BaseHandlerOptions } from "./base_handler.ts";

const PAGE_SIZE = 4096;
export type LogMode = "a" | "w" | "x";

export interface FileHandlerOptions extends BaseHandlerOptions {
  filename: string;
  mode?: LogMode;
}

/**
 * This handler will output to a file using an optional mode (default is `a`,
 * e.g. append). The file will grow indefinitely. It uses a buffer for writing
 * to file. Logs can be manually flushed with `fileHandler.flush()`. Log
 * messages with a log level greater than error are immediately flushed. Logs
 * are also flushed on process completion.
 *
 * Behavior of the log modes is as follows:
 *
 * - `'a'` - Default mode. Appends new log messages to the end of an existing log
 *   file, or create a new log file if none exists.
 * - `'w'` - Upon creation of the handler, any existing log file will be removed
 *   and a new one created.
 * - `'x'` - This will create a new log file and throw an error if one already
 *   exists.
 *
 * This handler requires `--allow-write` permission on the log file.
 */
export class FileHandler extends BaseHandler {
  protected file: Deno.FsFile | undefined;
  protected buf: Uint8Array = new Uint8Array(PAGE_SIZE);
  protected pointer = 0;
  protected filename: string;
  protected mode: LogMode;
  protected openOptions: Deno.OpenOptions;
  protected encoder: TextEncoder = new TextEncoder();
  #unloadCallback = (() => {
    this.destroy();
  }).bind(this);

  constructor(levelName: LevelName, options: FileHandlerOptions) {
    super(levelName, options);
    this.filename = options.filename;
    // default to append mode, write only
    this.mode = options.mode ? options.mode : "a";
    this.openOptions = {
      createNew: this.mode === "x",
      create: this.mode !== "x",
      append: this.mode === "a",
      truncate: this.mode !== "a",
      write: true,
    };
  }

  override setup() {
    this.file = Deno.openSync(this.filename, this.openOptions);
    this.#resetBuffer();

    addEventListener("unload", this.#unloadCallback);
  }

  override handle(logRecord: LogRecord) {
    super.handle(logRecord);

    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }

  override log(msg: string) {
    const bytes = this.encoder.encode(msg + "\n");
    if (bytes.byteLength > this.buf.byteLength - this.pointer) {
      this.flush();
    }
    this.buf.set(bytes, this.pointer);
    this.pointer += bytes.byteLength;
  }

  flush() {
    if (this.pointer > 0 && this.file) {
      let written = 0;
      while (written < this.pointer) {
        written += this.file.writeSync(
          this.buf.subarray(written, this.pointer),
        );
      }
      this.#resetBuffer();
    }
  }

  #resetBuffer() {
    this.pointer = 0;
  }

  override destroy() {
    this.flush();
    this.file?.close();
    this.file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
}
