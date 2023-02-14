# `std/redis`

Fast, lightweight and simple Redis client library for
[Deno](https://deno.land/).

## Features

- Supports [RESPv2](#respv2), [RESP3](#resp3), [raw data](#raw-data),
  [pipelining](#pipelining), [pub/sub](#pubsub), [transactions](#transactions),
  [eval scripts](#eval-script) and [Lua scripts](#lua-script).
- Compatible with [timeouts](#timeouts) and [retries](#retries).
- The fastest Redis client in Deno. [See below](#benchmarks) and
  [try benchmarking yourself](#contributing)!
- Written to be easily understood and debugged.
- Encourages the use of actual Redis commands without intermediate abstractions.

## Usage

Must be run with `--allow-net` permission. Check out the full documentation
[here](https://doc.deno.land/https://deno.land/std@$STD_VERSION/redis/mod.ts).

### RESPv2

```ts
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Returns "OK"
await sendCommand(redisConn, ["SET", "hello", "world"]);

// Returns "world"
await sendCommand(redisConn, ["GET", "hello"]);
```

If you don't care about the reply:

```ts
import { writeCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Returns nothing
await writeCommand(redisConn, ["SHUTDOWN"]);
```

### RESP3

```ts
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Switch to RESP3 protocol
await sendCommand(redisConn, ["HELLO", 3]);

// Returns 2
await sendCommand(redisConn, ["HSET", "hash3", "foo", 1, "bar", 2]);

// Returns { foo: "1", bar: "2" }
await sendCommand(redisConn, ["HGETALL", "hash3"]);
```

### Raw data

Set the last argument, `raw`, to `true` and bulk string replies will return raw
data instead of strings.

```ts
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// Returns "OK"
await sendCommand(redisConn, ["SET", "binary", data]);

// Returns same value as `data` variable
await sendCommand(redisConn, ["GET", "binary"], true);
```

### Pipelining

```ts
import { pipelineCommands } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Returns [1, 2, 3, 4]
await pipelineCommands(redisConn, [
  ["INCR", "X"],
  ["INCR", "X"],
  ["INCR", "X"],
  ["INCR", "X"],
]);
```

### Pub/Sub

```ts
import {
  readReplies,
  writeCommand,
} from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

await writeCommand(redisConn, ["SUBSCRIBE", "mychannel"]);
for await (const reply of readReplies(redisConn)) {
  // Prints ["subscribe", "mychannel", 1] first iteration
  console.log(reply);
}
```

### Transactions

```ts
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Returns "OK"
await sendCommand(redisConn, ["MULTI"]);

// Returns "QUEUED"
await sendCommand(redisConn, ["INCR", "FOO"]);

// Returns "QUEUED"
await sendCommand(redisConn, ["INCR", "FOO"]);

// Returns [1, 1]
await sendCommand(redisConn, ["EXEC"]);
```

### Eval Scripts

```ts
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Returns "hello"
await sendCommand(redisConn, ["EVAL", "return ARGV[1]", 0, "hello"]);
```

### Lua Scripts

```ts
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Returns "mylib"
await sendCommand(redisConn, [
  "FUNCTION",
  "LOAD",
  "#!lua name=mylib\nredis.register_function('knockknock', function() return 'Who\\'s there?' end)",
]);

// Returns "Who's there?"
await sendCommand(redisConn, ["FCALL", "knockknock", 0]);
```

### Timeouts

For further details on `deadline()`, see the documentation
[here](https://deno.land/std/async/deadline.ts?s=deadline).

```ts
import { deadline } from "https://deno.land/std@$STD_VERSION/async/deadline.ts";
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

const redisConn = await Deno.connect({ port: 6379 });

// Rejects if the command takes longer than 100 ms
await deadline(sendCommand(redisConn, ["SLOWLOG", "GET"]), 100);
```

> Note: this was added in v0.101.0 of the Deno Standard Library.

### Retries

For further details on `retry()`, see the documentation
[here](https://deno.land/std/async/retry.ts?s=retry).

```ts
import { retry } from "https://deno.land/std@$STD_VERSION/async/retry.ts";
import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";

// Retries to connect until successful using the exponential backoff algorithm.
const redisConn = await retry(async () => await Deno.connect({ port: 6379 }));
```

> Note: this was added in v0.167.0 of the Deno Standard Library.

## Contributing

Before submitting a pull request, please run
`deno task redis:start && deno task redis:test`.

> Note: Redis must be installed on your local machine. For installation
> instructions, see [here](https://redis.io/docs/getting-started/installation/).
