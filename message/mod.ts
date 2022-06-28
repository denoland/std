// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Messaging interface designed to scale to hundreds of modules. Suitable for
 * @module
 */
import { sprintf } from "../fmt/printf.ts";
import { format } from "../datetime/mod.ts";

/** Message logging levels. */
export enum MessageType {
  /** Information for developers. (typically very verbose) */
  Debug = 1,
  /** Status information. (typically intended for users) */
  Info = 2,
  /** An abnormal situation. (for users and/or developers) */
  Warning = 3,
  /** An error. (intended for users) */
  Critical = 4,
  /** An error that requires the program to quit. (developers and users) */
  Fatal = 5,
}

/** Metadata about a message. */
export interface MessageLogContext {
  /**
   * Category this message belongs to.
   */
  category: string;
  /**
   * Message level/severity.
   */
  type: "debug" | "info" | "warning" | "critical" | "fatal";
  /**
   * Filename (typically import.meta.url) of the caller.
   */
  filename: string;
}

/**
 * A class representing a certain category, or 'area' in the logging infrastructure.
 * Each category is identified by a string. A category can be enabled or
 * disabled, and it can be configured to enable or disable logging of specific
 * message types.
 *
 * Each category is registered in a global registry. As such, an error will be
 * thrown if the same category is created more than once. It is recommended
 * that modules have subcategories (`driver.usb`, `driver.bluetooth`), especially
 * for debug messages.
 */
export class MessageLoggingCategory {
  critical: boolean;
  debug: boolean;
  info: boolean;
  warning: boolean;

  constructor(
    public readonly categoryName: string,
    public readonly level = MessageType.Info,
  ) {
    this.critical = level <= MessageType.Critical;
    this.debug = level <= MessageType.Debug;
    this.info = level <= MessageType.Info;
    this.warning = level <= MessageType.Warning;
  }
}

let msgHandler: MessageHandler = defaultMessageHandler;

/** Callback responsible for printing messages. */
export type MessageHandler = (
  type: MessageType,
  context: MessageLogContext,
  str: string,
) => void;

// Returns true for -DIS_THIS_ENABLED=1, false otherwise.
function checkEnv(v: string): boolean {
  try {
    const val = Deno.env.get(v)!;
    if (val === "1") return true;
    return false;
  } catch (_err) {
    return false;
  }
}

function isFatal(msgType: MessageType) {
  if (msgType === MessageType.Fatal) return true;
  if (checkEnv("DENO_FATAL_CRITICALS")) return msgType >= MessageType.Critical;
  if (checkEnv("DENO_FATAL_WARNINGS")) return msgType >= MessageType.Warning;
  return false;
}

function isDefaultCategory(cat: string | undefined) {
  return !cat || cat === "default";
}

/**
 * Registers a message logger.
 * The message handler function is responsible for printing debug messages, warnings, and critical and fatal errors.
 * By implementing a custom message handler, you get full control over these output messages.
 *
 * The default message handler prints the message to standard output.
 * If it is a fatal message, the application aborts immediately after printing it.
 *
 * Only one message handler can be enabled, since this is usually handled on an application-wide basis to control the output.
 *
 * To restore the default handler, call `installMessageHandler()`.
 * @param handler
 */
export function installMessageHandler(
  handler?: MessageHandler,
): MessageHandler {
  const old = msgHandler;
  msgHandler = handler ?? defaultMessageHandler;
  return old ?? defaultMessageHandler;
}

const OPEN = "%{";
const CLOSE = "}";
const IF_MARKER = "if-";
const ENDIF_MARKER = "endif";
const DEFAULT_TEMPLATE = "%{if-category}%{category}: %{endif}%{message}";

let messagePattern = DEFAULT_TEMPLATE;

/**
 * Generates a formatted string out of the type, context, and str parameters.
 * This function returns a string formatted to the current message pattern.
 * Custom message handlers may use this to format output similar to the
 * default message format.
 */
export function formatLogMessage(
  type: MessageType,
  context: MessageLogContext,
  str: string,
): string {
  const isDebug = type === MessageType.Debug;
  const isInfo = type === MessageType.Info;
  const isWarn = type === MessageType.Warning;
  const isCritical = type === MessageType.Critical;
  const isFatal = type === MessageType.Fatal;

  const shouldSkip = (keyword: string) => {
    switch (keyword) {
      case "category":
        return isDefaultCategory(context.category);
      case "debug":
        return !isDebug;
      case "info":
        return !isInfo;
      case "warning":
        return !isWarn;
      case "critical":
        return !isCritical;
      case "fatal":
        return !isFatal;
    }
    // TODO: log or Error if unrecognized keyword?
    return true;
  };

  const r = new RegExp(`${OPEN}([\\s\\S]+?)${CLOSE}`, "g");
  let skipCount = 0;
  let result = messagePattern.replace(r, (_: string, key: string): string => {
    if (key.startsWith(IF_MARKER)) {
      const keyword = key.replace(IF_MARKER, "");
      if (shouldSkip(keyword)) {
        skipCount++;
        if (skipCount === 1) {
          return `${OPEN}remove${CLOSE}`;
        }
      }
      return "";
    } else if (key === ENDIF_MARKER) {
      if (skipCount === 1) {
        skipCount--;
        return `${OPEN}endremove${CLOSE}`;
      }
      skipCount = Math.max(skipCount - 1, 0);
      return "";
    } else if (skipCount > 0) {
      return "";
    } else if (key === "category") {
      return context.category;
    } else if (key === "type") {
      return context.type;
    } else if (key === "filename") {
      return context.filename;
    } else if (key === "message") {
      return str;
    } else if (key.startsWith("time ")) {
      const formatString = key.replace("time ", "");
      return format(new Date(), formatString);
    }

    // TODO: unrecognized key.
    return key;
  });

  const remover = new RegExp(
    `${OPEN}remove${CLOSE}[\\s\\S]+?${OPEN}endremove${CLOSE}`,
    "g",
  );

  result = result.replaceAll(remover, "");

  return result;
}

/**
 * Changes the output of the default message handler.
 * The output of {@link MessageLogger}, {@link debug}, {@link info},
 * {@link warning}, {@link critical}, and {@link fatal} can be customized using
 * this. This allows developers to specify information in their modules
 * (such as debug information) without worrying about how user applications
 * will *present* that information. Developers use
 * `debug("driver.usb", "Found 1080p UVC Camera on port 3")` in their modules,
 * then applications will decide if or how to print the information from
 * modules.
 *
 * The following placeholders are supported:
 *
 * | Placeholder | Description |
 * | ----------- | ----------- |
 * | `%{category}` | Logging category. |
 * | `%{filename}` | Filename (typically import.meta.url) |
 * | `%{message}` | The actual message. |
 * | `%{type}` | `"debug"`, `"info"`, `"warning"`, `"critical"`, or `"fatal"` |
 * | `%{time [pattern]}` | Current system time, formatted using the Deno datetime formatter. |
 * | `%{if-[condition]}` | Only printed if the condition is true or defined. |
 * | `%{endif}` | Closes the most recent `%{if}` call.
 *
 * The following conditions are supported: `%{if-debug}`, `%{if-info}`,
 * `%{if-warning}`, `%{if-critical}`, `%{if-fatal}`, and `%{if-category}`.
 *
 * The text inside `%{if-category}} ... %{endif}` will only be printed if the
 * category is not the default one.
 *
 * Example:
 * ```
 * "[%{time MM-dd-yyyy HH:mm:ss.SSS} %{if-debug}D%{endif}%{if-info}I%{endif}%{if-warning}W%{endif}%{if-critical}C%{endif}%{if-fatal}F%{endif}] %{filename} - %{message}"
 * ```
 *
 * The default pattern is `%{if-category}%{category}: %{endif}%{message}`.
 *
 * Custom message handlers can use formatLogMessage() to take the pattern into account.
 *
 * If no pattern is given, the default one will be restored.
 * @param pattern
 */
export function setMessagePattern(pattern?: string): void {
  messagePattern = pattern ?? DEFAULT_TEMPLATE;
}

/** Get the string name of a message type. */
export function getMessageTypeName(msgType: MessageType) {
  switch (msgType) {
    case MessageType.Critical:
      return "critical";
    case MessageType.Fatal:
      return "fatal";
    case MessageType.Info:
      return "info";
    case MessageType.Warning:
      return "warning";
    case MessageType.Debug:
    default:
      return "debug";
  }
}

// Registry of categories.
const categories = new Map<string, MessageLoggingCategory>([
  ["default", new MessageLoggingCategory("default", MessageType.Info)],
]);

function setCategory(name: string, status: boolean, level?: MessageType) {
  const cat = categories.get(name);
  if (!cat) {
    return;
  }
  if (!level) {
    cat.critical = status;
    cat.debug = status;
    cat.info = status;
    cat.warning = status;
    return;
  }
  switch (level) {
    case MessageType.Critical:
      cat.critical = status;
      break;
    case MessageType.Debug:
      cat.debug = status;
      break;
    case MessageType.Info:
      cat.info = status;
      break;
    case MessageType.Warning:
      cat.warning = status;
      break;
  }
}

/**
 * Disable messages from a category.
 * @param name
 * @param level
 */
export function disableCategory(name: string, level?: MessageType): void {
  setCategory(name, false, level);
}

/**
 * Enable messages from a category.
 * @param name
 */
export function enableCategory(name: string, level?: MessageType): void {
  setCategory(name, true, level);
}

/**
 * Registers a new category.
 * Every new category name must be created with this before it is used, or
 * the output will be incorrect.
 * @param categoryName
 * @param level
 */
export function LOGGING_CATEGORY(
  categoryName: string,
  level: MessageType = MessageType.Info,
) {
  if (categories.has(categoryName)) {
    throw new TypeError(`Category ${categoryName} already created`);
  }
  const cat = new MessageLoggingCategory(categoryName, level);
  categories.set(categoryName, cat);
}

/** Class responsible for printing messages. */
export class MessageLogger {
  constructor(
    public readonly category: string = "",
    public readonly level: MessageType = MessageType.Info,
  ) {
    if (!isDefaultCategory(category)) {
      LOGGING_CATEGORY(category, level);
    }
  }

  debug(msg: string, ...args: unknown[]): void;
  debug(cat: MessageLoggingCategory, ...args: unknown[]): void;

  /** Print a debug message. */
  debug(arg: string | MessageLoggingCategory, ...args: unknown[]) {
    // deno-lint-ignore no-explicit-any
    this.#print(MessageType.Debug, arg as any, ...args);
    if (isFatal(MessageType.Debug)) {
      Deno.exit(1);
    }
  }

  info(msg: string, ...args: unknown[]): void;
  info(cat: MessageLoggingCategory, ...args: unknown[]): void;

  /** Print an informational message. */
  info(arg: string | MessageLoggingCategory, ...args: unknown[]) {
    // deno-lint-ignore no-explicit-any
    this.#print(MessageType.Info, arg as any, ...args);
    if (isFatal(MessageType.Info)) {
      Deno.exit(1);
    }
  }

  warning(msg: string, ...args: unknown[]): void;
  warning(cat: MessageLoggingCategory, ...args: unknown[]): void;

  /** Print a warning message. */
  warning(arg: string | MessageLoggingCategory, ...args: unknown[]) {
    // deno-lint-ignore no-explicit-any
    this.#print(MessageType.Warning, arg as any, ...args);
    if (isFatal(MessageType.Warning)) {
      Deno.exit(1);
    }
  }

  critical(msg: string, ...args: unknown[]): void;
  critical(cat: MessageLoggingCategory, ...args: unknown[]): void;

  /** Print an error message. */
  critical(arg: string | MessageLoggingCategory, ...args: unknown[]) {
    // deno-lint-ignore no-explicit-any
    this.#print(MessageType.Critical, arg as any, ...args);
    if (isFatal(MessageType.Critical)) {
      Deno.exit(1);
    }
  }

  fatal(msg: string, ...args: unknown[]): void;
  fatal(cat: MessageLoggingCategory, ...args: unknown[]): void;

  /** Print a fatal error message. */
  fatal(arg: string | MessageLoggingCategory, ...args: unknown[]) {
    // deno-lint-ignore no-explicit-any
    this.#print(MessageType.Fatal, arg as any, ...args);
    Deno.exit(1);
  }

  #print(msgType: MessageType, msg: string, ...args: unknown[]): void;
  #print(
    msgType: MessageType,
    cat: MessageLoggingCategory,
    ...args: unknown[]
  ): void;

  /**
   * @internal
   */
  #print(
    msgType: MessageType,
    msg: string | MessageLoggingCategory,
    ...args: unknown[]
  ) {
    if (!msg) {
      return;
    }

    let baseMsg = msg;
    let cat = categories.get("default")!;
    let params = args;
    if (baseMsg instanceof MessageLoggingCategory) {
      cat = msg as MessageLoggingCategory;
      baseMsg = args[0] as string;
      params = args.slice(1);
    } else if (args.length > 0 && categories.has(baseMsg)) {
      cat = categories.get(baseMsg) as MessageLoggingCategory;
      baseMsg = args[0] as string;
      params = args.slice(1);
    } else if (!isDefaultCategory(this.category)) {
      cat = categories.get(this.category) as MessageLoggingCategory;
    }

    if (!this.#isLevelEnabled(msgType, cat)) {
      return;
    }
    const ctx: MessageLogContext = {
      category: cat.categoryName,
      type: getMessageTypeName(msgType),
      filename: import.meta.url,
    };
    const message = params.length > 0 ? sprintf(baseMsg, params) : baseMsg;
    print_message(msgType, ctx, message);
  }

  #isLevelEnabled(msgType: MessageType, cat: MessageLoggingCategory) {
    switch (msgType) {
      case MessageType.Critical:
        return cat.critical;
      case MessageType.Fatal:
        return true;
      case MessageType.Info:
        return cat.info;
      case MessageType.Warning:
        return cat.warning;
      case MessageType.Debug:
        return cat.debug;
    }
  }
}

export function debug(msg: string, ...args: unknown[]): void;
export function debug(cat: MessageLoggingCategory, ...args: unknown[]): void;

/**
 * Prints a debug message (if enabled).
 * `arg` may be a MessageLoggingCategory or a string. If `arg` is a string and
 * is the name of a registered category, then the rest of `args` are treated
 * as the message. Otherwise, the message is printed to the default category.
 * @param arg
 * @param args
 */
export function debug(
  arg: string | MessageLoggingCategory,
  ...args: unknown[]
): void {
  const logger = new MessageLogger();
  if (typeof arg === "string") {
    logger.debug(arg, ...args);
  } else {
    const cat = arg as MessageLoggingCategory;
    logger.debug(cat, ...args);
  }
}

export function info(msg: string, ...args: unknown[]): void;
export function info(cat: MessageLoggingCategory, ...args: unknown[]): void;

/**
 * Prints an informational message (if enabled).
 * `arg` may be a MessageLoggingCategory or a string. If `arg` is a string and
 * is the name of a registered category, then the rest of `args` are treated
 * as the message. Otherwise, the message is printed to the default category.
 * @param arg
 * @param args
 */
export function info(
  arg: string | MessageLoggingCategory,
  ...args: unknown[]
): void {
  const logger = new MessageLogger();
  if (typeof arg === "string") {
    logger.info(arg, ...args);
  } else {
    const cat = arg as MessageLoggingCategory;
    logger.info(cat, ...args);
  }
}

export function warning(msg: string, ...args: unknown[]): void;
export function warning(cat: MessageLoggingCategory, ...args: unknown[]): void;

/**
 * Prints an informational message (if enabled).
 * `arg` may be a MessageLoggingCategory or a string. If `arg` is a string and
 * is the name of a registered category, then the rest of `args` are treated
 * as the message. Otherwise, the message is printed to the default category.
 * @param arg
 * @param args
 */
export function warning(
  arg: string | MessageLoggingCategory,
  ...args: unknown[]
): void {
  const logger = new MessageLogger();
  if (typeof arg === "string") {
    logger.warning(arg, ...args);
  } else {
    const cat = arg as MessageLoggingCategory;
    logger.warning(cat, ...args);
  }
}

export function critical(msg: string, ...args: unknown[]): void;
export function critical(cat: MessageLoggingCategory, ...args: unknown[]): void;

/**
 * Prints an critical error message (if enabled).
 * `arg` may be a MessageLoggingCategory or a string. If `arg` is a string and
 * is the name of a registered category, then the rest of `args` are treated
 * as the message. Otherwise, the message is printed to the default category.
 * @param arg
 * @param args
 */
export function critical(
  arg: string | MessageLoggingCategory,
  ...args: unknown[]
): void {
  const logger = new MessageLogger();
  if (typeof arg === "string") {
    logger.critical(arg, ...args);
  } else {
    const cat = arg as MessageLoggingCategory;
    logger.critical(cat, ...args);
  }
}

export function fatal(msg: string, ...args: unknown[]): void;
export function fatal(cat: MessageLoggingCategory, ...args: unknown[]): void;

/**
 * Prints a fatal error message.
 * `arg` may be a MessageLoggingCategory or a string. If `arg` is a string and
 * is the name of a registered category, then the rest of `args` are treated
 * as the message. Otherwise, the message is printed to the default category.
 * @param arg
 * @param args
 */
export function fatal(
  arg: string | MessageLoggingCategory,
  ...args: unknown[]
): void {
  const logger = new MessageLogger();
  if (typeof arg === "string") {
    logger.fatal(arg, ...args);
  } else {
    const cat = arg as MessageLoggingCategory;
    logger.fatal(cat, ...args);
  }
}

function defaultMessageHandler(
  msgType: MessageType,
  context: MessageLogContext,
  message: string,
) {
  const formattedMessage = formatLogMessage(msgType, context, message);
  if (!formattedMessage) {
    return;
  }
  const encoder = new TextEncoder();
  const msg = encoder.encode(formattedMessage + "\n");
  if (msgType === MessageType.Info) {
    Deno.stdout.writeSync(msg);
  } else {
    Deno.stderr.writeSync(msg);
  }
}

function print_message(
  msgType: MessageType,
  context: MessageLogContext,
  message: string,
) {
  msgHandler(msgType, context, message);
}
