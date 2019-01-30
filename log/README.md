# Log

## Basic usage

```ts
import * as log from "https://deno.land/x/std/log/mod.ts";

// simple default logger, you can customize it 
// by overriding logger and handler named "default"
log.debug("Hello world");
log.info("Hello world");
log.warning("Hello world");
log.error("Hello world");
log.critical("500 Internal server error");

// configure as needed
await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
    file: new log.handlers.FileHandler("WARNING", { 
      filename: "./log.txt",
      // you can change format of output message
      formatter: "{levelName} {msg}",
    }),
  },

  loggers: {
    // this configures logger available via short-hand methods above
    default: {
      level: "DEBUG",
      handlers: ["console", "file"]
    },

    tasks: {
      level: "ERROR",
      handlers: ["console"],
    }
  }
});

let logger;

// get default logger
logger = log.getLogger();
logger.debug("fizz"); // logs to `console`, because `file` handler requires "WARNING" level
logger.warning("buzz"); // logs to both `console` and `file` handlers

// get custom logger
logger = log.getLogger("tasks");
logger.debug("fizz"); // won't get output becase this logger has "ERROR" level
logger.error("buzz"); // log to `console`

// if you try to use a logger that hasn't been configured
// you're good to go, it gets created automatically with level set to 0
// so no message is logged
unknownLogger = log.getLogger("mystery");
unknownLogger.info("foobar"); // no-op
```

## Configuration
To configure `log` for custom needs use `setup` method. 

```ts
await log.setup({
  // handlers that will be available to loggers
  handlers: {
    // outputs to stdout
    console: new log.handlers.ConsoleHandler("DEBUG"),
    // outputs to file
    file: new log.handlers.FileHandler("WARNING", "./log.txt")
  },

  // loggers that will be available via `log.getLogger()` method
  loggers: {
    // default logger that is always automatically created
    // available via short-hand methods `log.debug()`, etc.
    default: {
      level: "DEBUG",
      handlers: ["console", "file"]
    }
  }
});
```

## Advanced usage

### Loggers
Loggers are objects that you interact with. When you use logger method it constructs a `LogRecord` and passes it down to its handlers for output.

TODO: describe logging methods

#### `LogRecord`
`LogRecord` is an object that encapsulates provided message and arguments as well some meta data that can be later used when formatting a message.

```ts
interface LogRecord {
  msg: string;
  args: any[];
  datetime: Date;
  level: number;
  levelName: string;
}
```

### Handlers
Handlers are responsible for actual output of log messages. When handler is called by logger it firstly checks that `LogRecord`'s level is not lower than level of the handler. Then handler formats record into
string and outputs it to target. 

`log` module comes with two built-in handlers: 
- `ConsoleHandler`
- `FileHandler`

#### Custom message format
If you want to override default format of message you can define `formatter` option for handler. It can be either simple string-based
format that uses `LogRecord` fields or more complicated function-based one that takes `LogRecord` as argument and outputs string.

Eg.
```ts
await log.setup({
  handlers: {
    stringFormatter: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{levelName} {datetime} {msg}"
    }),

    functionFormatter: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: logRecord => {
        let msg = `{logRecord.levelName} {logRecord.msg}`;

        logRecord.args.forEach((arg, index) => {
          msg += ` arg{index}: {arg}`;
        });

        return msg;
      }
    }),
  }
})
```
#### Custom handlers
Custom handlers can be implemented by subclassing `BaseHandler` or `WriterHandler`. First one is bare-metal handler that has no logging logic, second one is more generic and supports `Writer` interface - check source code of `FileHandler` or `TestHandler` for examples of
custom handlers. 
