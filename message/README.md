# Message

Message is a module for categorized message logging designed to scale to
hundreds of modules.

Largely a port of the Qt C++ message logging framework, it allows modules to
emit information without worrying about the presentation.

Consider two use cases:

1. A command-line app that wants to print only status messages and fatal errors.
2. A server that wants to print every debug message, even from hundreds of
   modules.

By delegating the presentation to the application, modules can handle both use
cases.

Debug messages are disabled by default.

## Usage

```ts
import {
  debug,
  disableCategory,
  enableCategory,
  formatLogMessage,
  info,
  installMessageHandler,
  LOGGING_CATEGORY,
  MessageLogContext,
  MessageLogger,
  MessageType,
  setMessagePattern,
  warning,
} from "https://deno.land/std@$STD_VERSION/message/mod.ts";
import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";

// Create a new category.
LOGGING_CATEGORY("driver.usb");

warning("This is a test warning"); // Should print "This is a test warning"
warning("driver.usb", "No USB devices found"); // Should print "driver.usb: No USB devices found"

const logger = new MessageLogger("driver.gpu", MessageType.Debug);
logger.debug("GPU Vendor = Intel"); // Should print "driver.gpu: GPU Vendor = Intel"

// Shouldn't print anything (debug messages disabled by default).
debug("driver.usb", "PCI device 1 found");

enableCategory("driver.usb", MessageType.Debug);
// Should print "driver.usb: PCI device 2 found"
debug("driver.usb", "PCI device 2 found");

disableCategory("driver.gpu"); // Disable all messages from `driver.gpu`
warning("driver.gpu", "Old driver found"); // Shouldn't print anything

// Only print fatal and info messages from "driver.usb" category.
function myPrint(type: MessageType, context: MessageLogContext, str: string) {
  if (context.category !== "driver.usb") {
    return;
  }
  const msg = formatLogMessage(type, context, str);
  if (type === MessageType.Info) {
    log.info(msg);
  } else if (type === MessageType.Fatal) {
    log.critical(msg);
  }
}
installMessageHandler(myPrint);
info("driver.usb", "Colored message"); // Should print "INFO driver.usb: Colored message"
installMessageHandler();

setMessagePattern(
  "[%{if-debug}D%{endif}%{if-info}I%{endif}%{if-warning}W%{endif}%{if-critical}C%{endif}%{if-fatal}F%{endif}] %{message}",
);
info("Successfully downloaded"); // Should print "[I] Successfully downloaded"
setMessagePattern();
```

## Advanced usage

### Message levels

Different severity levels are exported in the `MessageType` enum type. By
default, only `Info` messages and above are printed. Fatal error messages cannot
be disabled, and will always exit with a failure code afterwards.

### `MessageHandler`

`MessageHandler` is the function responsible for printing messages. The default
message handler will print info messages to stdout and all other messages to
stderr.

Register a new message handler with `installMessageHandler`. The old message
handler will be returned. To restore the default message handler, call
`installMessageHandler()` with no arguments.

> _NOTE: There can only be one message handler at a time._

> _NOTE: Modules should never need to register a message handler. Applications
> should register their own message handler when they need to have full control
> over messages._

### Creating new categories

Every category (except the default) must be created by registering it with
`LOGGING_CATEGORY` before it is used, or the output will not be correct.

### Enable/disable categories

Category levels can be enabled or disabled by calling
`enableCategory`/`disableCategory` with a `MessageType` level. If no level is
given, all message levels except fatal are enabled/disabled.

### Message patterns

The output message format can be customized by registering a pattern with
`setMessagePattern`. A message pattern may contain placeholders which will be
replaced at runtime.

The following placeholders are supported:

| Placeholder          | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `{{category }}`      | Logging category.                                                 |
| `{{filename}}`       | Filename (typically import.meta.url)                              |
| `{{message}}`        | The actual message.                                               |
| `{{type}}`           | `"debug"`, `"info"`, `"warning"`, `"critical"`, or `"fatal"`      |
| `{{time [pattern]}}` | Current system time, formatted using the Deno datetime formatter. |
| `{{if [condition]}}` | Only printed if the condition is true or defined.                 |
| `{{endif}}`          | Closes the most recent `{{if}}` call.                             |

The following conditions are supported: `{{if debug}}`, `{{if info}}`,
`{{if warning}}`, `{{if critical}}`, `{{if fatal}}`, and `{{if category}}`.

The text inside `{{if category}} ... {{endif}}` will only be printed if the
category is not the default one.

Example:

```
"[{{time MM-dd-yyyy HH:mm:ss.SSS}} {{if debug}}D{{endif}}{{if info}}I{{endif}}{{if warning}}W{{endif}}{{if critical}}C{{endif}}{{if fatal}}F{{endif}}] {{filename}}: - {{message}}"
```

The default pattern is `{{#if category}}{{category}}: {{/if}}{{message}}`.

Custom message handlers can use `formatLogMessage()` to take the pattern into
account.

### `MessageLogger`

The class responsible for printing log messages. Without any parameters, an
instance of the default category will be created with the `Info` level. If a
category name is given, a new category will be created.

> _NOTE: A message category created with `LOGGING_CATEGORY` should never be
> created using a `MessageLogger`._

### `debug`/`info`/`warning`/`critical`/`fatal`

These functions call the message handler with the appropriate level.

Each function works by creating a new `MessageLogger` with the default category
and calling the appropriate method.

> _NOTE: When using a category, developers must register it using
> `LOGGING_CATEGORY` first or the output will not be correct._

## API

```
enum MessageType {
  Debug = 1,
  Info = 2,
  Warning = 3,
  Critical = 4,
  Fatal = 5,
}

interface MessageLogContext {
  category: string;
  type: "debug" | "info" | "warning" | "critical" | "fatal";
  filename: string;
}

class MessageLoggingCategory {
  readonly categoryName: string;
  critical: boolean;
  debug: boolean;
  info: boolean;
  warning: boolean;

  constructor(category: string, severityLevel = MessageType.Debug);
}

type MessageHandler = (
  type: MessageType,
  context: MessageLogContext,
  str: string,
) => void;

function installMessageHandler(
  handler: MessageHandler | undefined,
): MessageHandler;

function formatLogMessage(
  type: MessageType,
  context: MessageLogContext,
  str: string,
): string;

function setMessagePattern(pattern: string): void;

function enableCategory(name: string, level?: MessageType): void;
function disableCategory(name: string, level?: MessageType): void;

function LOGGING_CATEGORY(
  categoryName: string,
  level: MessageType = MessageType.Debug,
);

class MessageLogger {
  constructor(
    public readonly category: string = "",
    public readonly level: MessageType = MessageType.Debug,
  );

  debug(msg: string, ...args: unknown[]): void;
  debug(cat: MessageLoggingCategory, ...args: unknown[]): void;

  info(msg: string, ...args: unknown[]): void;
  info(cat: MessageLoggingCategory, ...args: unknown[]): void;

  warning(msg: string, ...args: unknown[]): void;
  warning(cat: MessageLoggingCategory, ...args: unknown[]): void;

  critical(msg: string, ...args: unknown[]): void;
  critical(cat: MessageLoggingCategory, ...args: unknown[]): void;

  fatal(msg: string, ...args: unknown[]): void;
  fatal(cat: MessageLoggingCategory, ...args: unknown[]): void;
}

function debug(msg: string, ...args: unknown[]): void;
function debug(cat: MessageLoggingCategory, ...args: unknown[]): void;

function info(msg: string, ...args: unknown[]): void;
function info(cat: MessageLoggingCategory, ...args: unknown[]): void;

function warning(msg: string, ...args: unknown[]): void;
function warning(cat: MessageLoggingCategory, ...args: unknown[]): void;

function critical(msg: string, ...args: unknown[]): void;
function critical(cat: MessageLoggingCategory, ...args: unknown[]): void;

function fatal(msg: string, ...args: unknown[]): void;
function fatal(cat: MessageLoggingCategory, ...args: unknown[]): void;
```
