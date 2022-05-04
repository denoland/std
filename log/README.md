# log

## Loggers

### ConsoleLogger

```ts
import { ConsoleLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
const logger = new ConsoleLogger(ConsoleLogger.logLevels.trace);
logger.trace("trace");
logger.debug("debug");
logger.info("info");
logger.warn("warn");
logger.error("error");
```

Output

```sh
trace
debug
info
warn
error
```

### FileLogger

```ts
import { FileLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
const logger = new FileLogger(FileLogger.logLevels.trace, "./log.txt");
logger.trace("trace");
logger.debug("debug");
logger.info("info");
logger.warn("warn");
logger.error("error");
```

log.txt

```sh
trace
debug
info
warn
error
```

## Default log levels

| Name  | Number |
| ----- | ------ |
| trace | 10     |
| debug | 20     |
| info  | 30     |
| warn  | 40     |
| error | 50     |

## Custom log levels

```ts
import { ConsoleLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

class CustomConsoleLogger extends ConsoleLogger {
  static logLevels = {
    ...super.logLevels,
    fatal: 60,
  };
  fatal(...data: unknown[]) {
    this.dispatch(data, CustomConsoleLogger.logLevels.fatal);
  }
}

const logger = new CustomConsoleLogger(ConsoleLogger.logLevels.error);
logger.error("error");
logger.fatal("fatal");
```

Output

```sh
error
fatal
```

## Custom handler

```ts
import { FileLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

class CustomFileLogger extends FileLogger {
  protected handler(data: unknown[]) {
    super.handler(["Custom Handler:", ...data]);
  }
}
const fileLogger = new CustomFileLogger(
  CustomFileLogger.logLevels.trace,
  "./log.txt",
);
fileLogger.info("some", "information");
```

log.txt

```txt
Custom Handler: some information
```
