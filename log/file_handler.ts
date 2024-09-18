// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { type LevelName, LogLevels } from "./levels.ts";
import type { LogRecord } from "./logger.ts";
import { BaseHandler, type BaseHandlerOptions } from "./base_handler.ts";
import { writeAllSync } from "@std/io/write-all";
import {
  bufSymbol,
  encoderSymbol,
  filenameSymbol,
  fileSymbol,
  modeSymbol,
  openOptionsSymbol,
  pointerSymbol,
} from "./_file_handler_symbols.ts";

/** The log mode */
export type LogMode = "a" | "w" | "x";

/** The option for {@linkcode FileHandler} */
export interface FileHandlerOptions extends BaseHandlerOptions {
  /** The filename */
  filename: string;
  /**
   * The log mode
   * @default {"a"}
   */
  mode?: LogMode;
  /**
   * Buffer size for writing log messages to file, in bytes.
   *
   * @default {4096}
   */
  bufferSize?: number;
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
  /**
   * A private field
   * @private
   */
  [fileSymbol]: Deno.FsFile | undefined;
  /**
   * A private field
   * @private
   */
  [bufSymbol]: Uint8Array;
  /**
   * A private field
   * @private
   */
  [pointerSymbol] = 0;
  /**
   * A private field
   * @private
   */
  [filenameSymbol]: string;
  /**
   * A private field
   * @private
   */
  [modeSymbol]: LogMode;
  /**
   * A private field
   * @private
   */
  [openOptionsSymbol]: Deno.OpenOptions;
  /**
   * A private field
   * @private
   */
  [encoderSymbol]: TextEncoder = new TextEncoder();
  #unloadCallback = (() => {
    this.destroy();
  }).bind(this);

  /** Construct a {@linkcode FileHandler} */
  constructor(levelName: LevelName, options: FileHandlerOptions) {
    super(levelName, options);
    this[filenameSymbol] = options.filename;
    // default to append mode, write only
    this[modeSymbol] = options.mode ?? "a";
    this[openOptionsSymbol] = {
      createNew: this[modeSymbol] === "x",
      create: this[modeSymbol] !== "x",
      append: this[modeSymbol] === "a",
      truncate: this[modeSymbol] !== "a",
      write: true,
    };
    this[bufSymbol] = new Uint8Array(options.bufferSize ?? 4096);
  }

  /** Sets up the log handler */
  override setup() {
    this[fileSymbol] = Deno.openSync(
      this[filenameSymbol],
      this[openOptionsSymbol],
    );
    this.#resetBuffer();

    addEventListener("unload", this.#unloadCallback);
  }

  /** Handles the log record */
  override handle(logRecord: LogRecord) {
    super.handle(logRecord);

    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }

  /** Logs the message */
  log(msg: string) {
    const bytes = this[encoderSymbol].encode(msg + "\n");
    if (bytes.byteLength > this[bufSymbol].byteLength - this[pointerSymbol]) {
      this.flush();
    }
    if (bytes.byteLength > this[bufSymbol].byteLength) {
      writeAllSync(this[fileSymbol]!, bytes);
    } else {
      this[bufSymbol].set(bytes, this[pointerSymbol]);
      this[pointerSymbol] += bytes.byteLength;
    }
  }

  /** Flushes the buffered logs to the file */
  flush() {
    if (this[pointerSymbol] > 0 && this[fileSymbol]) {
      let written = 0;
      while (written < this[pointerSymbol]) {
        written += this[fileSymbol].writeSync(
          this[bufSymbol].subarray(written, this[pointerSymbol]),
        );
      }
      this.#resetBuffer();
    }
  }

  #resetBuffer() {
    this[pointerSymbol] = 0;
  }

  /** Destroys the log handler */
  override destroy() {
    this.flush();
    this[fileSymbol]?.close();
    this[fileSymbol] = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
}
