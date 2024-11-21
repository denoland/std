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

/** Supported log modes for FileHandlerOptions {@linkcode FileHandlerOptions.mode}. */
export type LogMode = "a" | "w" | "x";

/** Options for {@linkcode FileHandler}. */
export interface FileHandlerOptions extends BaseHandlerOptions {
  /**
   * The filename to output to.
   */
  filename: string;
  /**
   * Log mode for the handler. Behavior of the log modes is as follows:
   *
   * - `'a'` - Default mode. Appends new log messages to the end of an existing log
   *   file, or create a new log file if none exists.
   * - `'w'` - Upon creation of the handler, any existing log file will be removed
   *   and a new one created.
   * - `'x'` - This will create a new log file and throw an error if one already
   *   exists.
   *
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
 * A file-based log handler that writes log messages to a specified file with buffering and optional modes.
 * The logs are buffered for optimized performance, writing to the file only
 * when the buffer is full, on manual .flush() call, during logging of a critical message or when process ends.
 * It is important to note that the file can grow indefinitely.
 *
 * This handler requires `--allow-write` permission on the log file.
 *
 * @example Usage
 * ```ts no-assert ignore
 * import { FileHandler } from "@std/log/file-handler";
 *
 * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
 * handler.setup();
 * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
 * handler.flush(); // Manually flushes the buffer
 * handler.destroy(); // Closes the file and removes listeners
 * ```
 */
export class FileHandler extends BaseHandler {
  /** Opened file to append logs to.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [fileSymbol]: Deno.FsFile | undefined;
  /** Buffer used to write to file.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [bufSymbol]: Uint8Array;
  /** Current position for pointer.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [pointerSymbol] = 0;
  /** Filename associated with the file being logged.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [filenameSymbol]: string;
  /** Current log mode.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [modeSymbol]: LogMode;
  /** File open options.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [openOptionsSymbol]: Deno.OpenOptions;
  /** Text encoder.
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!'); // Buffers the message, or writes it to the file depending on buffer state
   * handler.flush(); // Manually flushes the buffer
   * handler.destroy(); // Closes the file and removes listeners
   * ```
   * **/
  [encoderSymbol]: TextEncoder = new TextEncoder();
  #unloadCallback = (() => {
    this.destroy();
  }).bind(this);

  /**
   * Constructs a new FileHandler instance.
   *
   * @param levelName The level name to log messages at.
   * @param options Options for the handler.
   */
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

  /**
   * Sets up the file handler by opening the specified file and initializing resources.
   *
   * @example Usage
   * ```ts no-assert ignore
   * import { FileHandler } from "@std/log/file-handler";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup(); // Opens the file and prepares the handler for logging.
   * handler.destroy();
   * ```
   */
  override setup() {
    this[fileSymbol] = Deno.openSync(
      this[filenameSymbol],
      this[openOptionsSymbol],
    );
    this.#resetBuffer();

    addEventListener("unload", this.#unloadCallback);
  }

  /**
   * Handles a log record and flushes the buffer if the log level is higher than error.
   *
   * @param logRecord Log record to handle.
   *
   * @example Usage
   * ```ts ignore
   * import { FileHandler } from "@std/log/file-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   * import { LogLevels } from "./levels.ts";
   * import { LogRecord } from "./logger.ts";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   *
   * // Flushes the buffer immediately and logs "CRITICAL This log is very critical indeed." into the file.
   * handler.handle(
   *   new LogRecord({
   *     msg: "This log is very critical indeed.",
   *     args: [],
   *     level: LogLevels.CRITICAL,
   *     loggerName: "INFO",
   *   }),
   * );
   * handler.destroy();
   *
   * assertInstanceOf(handler, FileHandler);
   * ```
   */
  override handle(logRecord: LogRecord) {
    super.handle(logRecord);

    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }

  /**
   * Logs a message by adding it to the buffer, with flushing as needed.
   *
   * @param msg The message to log.
   *
   * @example Usage
   * ```ts ignore
   * import { FileHandler } from "@std/log/file-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!');
   * handler.flush();
   * handler.destroy();
   *
   * assertInstanceOf(handler, FileHandler);
   * ```
   */
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

  /**
   * Immediately writes the contents of the buffer to the previously opened file.
   *
   * @example Usage
   * ```ts ignore
   * import { FileHandler } from "@std/log/file-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.log('Hello, world!');
   * handler.flush(); // Writes buffered log messages to the file immediately.
   * handler.destroy();
   *
   * assertInstanceOf(handler, FileHandler);
   * ```
   */
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

  /**
   * Destroys the handler, performing any cleanup that is required and closes the file handler.
   *
   * @example Usage
   * ```ts ignore
   * import { FileHandler } from "@std/log/file-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * const handler = new FileHandler("INFO", { filename: "./logs.txt" });
   * handler.setup();
   * handler.destroy();
   *
   * assertInstanceOf(handler, FileHandler);
   * ```
   */
  override destroy() {
    this.flush();
    this[fileSymbol]?.close();
    this[fileSymbol] = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
}
