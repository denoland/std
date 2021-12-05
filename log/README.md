# Log

Module providing a preconfigured default logger, logging for external modules
and functions to build custom loggers.

**If you are a library author, please see the "Third Party Logging" section at
the bottom**

## Get started

If you just want to log to stdout and stderr, use the default logger like this:

```ts
import { log } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

log.info("Some message");
log.error("Error!", someObject);
```

## Default Logging

The above example uses the default logger, which is exported as `log`. By
default, it will log anything above and including "info" level messages to
stdout/stderr, but you can fully customize it, disabling the default behaviour,
changing its threshold or adding more loggers receiving it's messages. Third
party loggers will use the defautl logger as well, giving you a central place to
control how they are handled. We will look at framework logging later.

### Default Log Levels

The default log levels are (in order of importance, top ones being more
important):

1. `error`
2. `warn`
3. `info`
4. `debug`
5. `trace`

They are exported as `defaultLogLevels`, but will automatically be used by `log`
and all `buildDefault-` loggers

## Builtin Logger Types & Custom Log Levels

There are three builtin loggers that can be used with custom log levels to build
custom loggers. They all use the same message formatter by default, but can be
configured to use any custom one. They all accept a `threshold` to filter
messages. They also accept optional type parameters to set the type for the
passed `message`s and optional `additionalData`, allowing to enforce custom log
formats throughout your application.

You define custom log levels with a simple record like this:

```ts
const myLogLevels = {
  foo: 1,
  bar: 2,
};

const logger = buildConsoleLogger(
  myLogLevels,
  "foo",
  (level) => false,
);

logger.foo("A message");
logger.bar("Another message", ["some", "additional", "data"]);
```

You could define a logger that just accepts `numbers` and no additional data to
print them to a number log file like this:

```ts
const myLogLevels = {
  minor: 1,
  major: 2,
};

const logger = buildFileLogger<typeof myLogLevels, number, undefined>(
  myLogLevels,
  "major",
  "numbers.log",
);

logger.minor(5);
logger.major(10);
```

The three builtin loggers are:

### Console Logger

A logger that prints to `stdout` and `stderr`, see `buildConsoleLogger`.

### File Logger

A logger that writes lines to a file, see `buildFileLogger`. Keep in mind that
this needs write permissions via `--allow-write`.

### Multi Logger

A logger that passes messages on to a list of other loggers, see
`buildMultiLogger`. It pass on all messages by default (`threshold = null`) but
can be configured to filter like any other logger.

## Custom Loggers

Using `buildLogger`, you can build a completely custom logger with custom log
levels, message handling and even optional custom dispatching logic (the default
dispatcher is responsible for filtering messages based on `threshold`).

A vote logger that will only show messages below the threshold after the 5th
message, that accepts only strings and that truncates messages to 10 chars could
look like this:

```ts
const logLevels = {
  irrelevant: 1,
  normal: 2,
  important: 3,
};

const counts = {
  irrelevant: 0,
  normal: 0,
  important: 0,
};

const logger = buildLogger(
  logLevels,
  "normal",
  (level, message: string) => {
    console.log(message.substr(0, 10));
  },
  (levels, threshold, handler, level, message) => {
    counts[level] += 1;

    if (levels[threshold] > levels[level] || counts[level] >= 5) {
      handler(level, message);
    }
  },
);
```

### Third Party Logging

#### As a Third Party

If you are a framework or library author that wants to log for their users,
please use `buildThirdPartyLogger` and pass an identifier to it that is unique
to your library. That identifier will be displayed in log messages. Users of
your module will be able to customize logging behaviour for your messages,
passing warning and errors on by default:

```ts
import { buildThirdPartyLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

const logger = buildThirdPartyLogger("awesome-lib");

logger.info("Some message");
```

#### As a consumer

If you are a importing external modules, you can customize the thresholds for
their messages using `setThirdPartyThresholds` together with their name, which
you will find at the beginning of their messages:

```typescript
import { setThirdPartyThresholds } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

setThirdPartyThresholds({
  "awesome-lib": "info",
});
```

By default, their threshold is set to `warn` - you can change that default for
all externals modules using `setThirdPartyDefaultThreshold`:

```typescript
import { setThirdPartyDefaultThreshold } from "https://deno.land/std@$STD_VERSION/log/mod.ts";

setThirdPartyDefaultThreshold("info");
```
