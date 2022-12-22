// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Messaging interface designed to scale to hundreds of modules.
 * @module
 */
import { sprintf } from "../fmt/printf.ts";

/**
 * Message logging levels.
 *
 * Different message levels:
 *
 * + `log` - Debug messages, mostly used for developers.
 * + `info` - Module status information, suitable for users.
 * + `warn` - Warning messages about something that can't be ignored.
 * + `error` - Something has gone wrong and the module cannot continue.
 */
export type MessageLevel = "log" | "info" | "warn" | "error";

/** Metadata about a message. */
export interface MessageContext {
  /** Category sending this message. */
  category: MessageCategory;
  /** Message level/severity. */
  level: MessageLevel;
  /** Filename (typically `import.meta.url`) of the message sender. */
  filename: string;
  /** Time the message was sent. */
  time: Date;
}

/** A class for categorized messages. */
export class MessageCategory {
  /** Silence all output from this category if true. */
  quiet = false;

  constructor(public readonly name: string) {}

  /** Log a debug message. */
  log(arg: string, ...args: unknown[]) {
    this.#print("log", arg, ...args);
  }

  /** Log an informational message. */
  info(arg: string, ...args: unknown[]) {
    this.#print("info", arg, ...args);
  }

  /** Log a warning message. */
  warn(arg: string, ...args: unknown[]) {
    this.#print("warn", arg, ...args);
  }

  /** Log an error message. */
  error(arg: string, ...args: unknown[]) {
    this.#print("error", arg, ...args);
  }

  /**
   * @internal
   */
  #print(
    level: MessageLevel,
    msg: string,
    ...args: unknown[]
  ) {
    // Do not print empty messages or when in quiet mode.
    if (!msg || this.quiet) {
      return;
    }
    const message = sprintf(msg, ...args);
    const context: MessageContext = {
      category: this,
      level: level,
      filename: import.meta.url,
      time: new Date(),
    };
    msgHandler(message, context);
  }
}

let msgHandler: MessageHandler = defaultMessageHandler;

/** Callback responsible for printing messages. */
export type MessageHandler = (
  msg: string,
  context: MessageContext,
) => void;

/**
 * Registers a message logger.
 * The message handler function is responsible for printing debug messages, warnings, and critical and fatal errors.
 * By implementing a custom message handler, you get full control over these output messages.
 *
 * Only one message handler can be enabled, since this is usually handled on an application-wide basis to control the output.
 *
 * To restore the default handler, call `setMessageHandler()`.
 * @param handler
 */
export function setMessageHandler(
  handler?: MessageHandler,
): MessageHandler {
  const old = msgHandler;
  msgHandler = handler ?? defaultMessageHandler;
  return old ?? defaultMessageHandler;
}

function defaultMessageHandler(_message: string, _context: MessageContext) {
}
