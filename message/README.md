# Message

Message is a module for categorized message logging designed to scale to
hundreds of modules.

Inspired by the Qt C++ message logging framework, it allows modules to emit
information without worrying about the presentation.

By default, no messages are printed. Applications must create a message handler
function with `setMessageHandler`.

## Usage

### Module

```ts
// deno.land/x/customdrivers@0.0.0/mod.ts
import { MessageCategory } from "https://deno.land/std@$STD_VERSION/message/mod.ts";

const usbLogger = new MessageCategory("driver.usb");
const gpuLogger = new MessageCategory("driver.gpu");

export function installDrivers() {
  gpuLogger.log("Found graphics driver version %s", gpuVersion);
  usbLogger.info("Found 2 USB devices");
  gpuLogger.warn("Obsolete graphics driver found");
  if (unplugged) {
    usbLogger.error("USB device unplugged");
  }
}
```

### Application

```ts
// main.ts
import {
  MessageContext,
  setMessageHandler,
} from "https://deno.land/std@$STD_VERSION/message/mod.ts";
import { red } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
import { installDrivers } from "https://deno.land/x/customdrivers@0.0.0/mod.ts";

function onlyPrintErrorsFromUSB(msg: string, context: MessageContext) {
  if (context.level !== "error" || context.category.name !== "driver.usb") {
    return;
  }
  console.log(red(msg));
  Deno.exit(1);
}
setMessageHandler(onlyPrintErrorsFromUSB);
installDrivers();
```

## Rationale

A major problem for modules is how to send information to applications without
altering control flow, as well as how to control the format of the output.

Modules shouldn't control the format of message logging. If they did,
applications woulds wind up printing in dozens of different styles. Messages
solves this by delegating all printing to the final application, not the module.
Modules supply the information, while applications decide what to do with it,
similar to how a single intelligence agency receives information from countless
agents, then decides what to do with the collected information.

Consider a module that wraps `fetch()` with retries. A server application will
likely want to print a range of information like that this is a network category
message, the time it took place, and the message itself. A command-line
application might want to print each retry message in color, or it might not
want to print anything at all if there's a `--quiet` flag.

Messages makes no assumptions about if or how a message will be printed. That
falls to the application. As such, module authors should not attempt to register
their own message handler with `setMessageHandler`. Leave that to the developers
who are using your module. Instead, use messages to supply as much information
as you want and let them deal with it.

> Authors are encouraged to use the naming convention _module
> name_._sub-category_ for MessageCategory names. This will allow applications
> to filter messages more effectively.

## API

```
type MessageLevel = "log" | "info" | "warn" | "error";

class MessageCategory {
  constructor(public readonly name: string);

  quiet = false;

  log(msg: string, ...args: unknown[]);
  info(msg: string, ...args: unknown[]);
  warn(msg: string, ...args: unknown[]);
  error(msg: string, ...args: unknown[]);
}

interface MessageContext {
  category: MessageCategory;
  level: MessageLevel;
  filename: string;
  time: Date;
}

type MessageHandler = (msg: string, context: MessageContext) => void;

function setMessageHandler(handler?: MessageHandler): MessageHandler;
```
