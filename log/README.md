# log

## Default logLevels

| Name  | Number |
| ----- | ------ |
| trace | 10     |
| debug | 20     |
| info  | 30     |
| warn  | 40     |
| error | 50     |

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

## Custom logLevels

```ts
import { ConsoleLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

class CustomConsoleLogger extends ConsoleLogger {
  static override logLevels = {
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
  protected override handler(data: unknown[]) {
    super.handler([new Date().toISOString(), ...data.join("->")]);
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
2021-11-15T01:27:39.314Z some->information
```
