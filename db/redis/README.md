# deno-redis

[![Build Status](https://github.com/denodrivers/redis/workflows/CI/badge.svg)](https://github.com/denodrivers/redis/actions)
![https://img.shields.io/github/tag/denodrivers/redis.svg](https://img.shields.io/github/tag/denodrivers/redis.svg)
[![license](https://img.shields.io/github/license/denodrivers/redis.svg)](https://github.com/denodrivers/redis)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/redis/mod.ts)
[![Discord](https://img.shields.io/discord/768918486575480863?logo=discord)](https://discord.gg/QXuHBMcgWx)

An experimental implementation of redis client for deno

## Usage

needs `--allow-net` privilege

**Stateless Commands**

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";
const redis = await connect({
  hostname: "127.0.0.1",
  port: 6379,
});
const ok = await redis.set("hoge", "fuga");
const fuga = await redis.get("hoge");
```

**PubSub**

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1" });
const sub = await redis.subscribe("channel");
(async function () {
  for await (const { channel, message } of sub.receive()) {
    // on message
  }
})();
```

**Streams**

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1" });
await redis.xadd(
  "somestream",
  "*", // let redis assign message ID
  { yes: "please", no: "thankyou" },
  { elements: 10 },
);

const [stream] = await redis.xread(
  [{ key: "somestream", xid: 0 }], // read from beginning
  { block: 5000 },
);

const msgFV = stream.messages[0].fieldValues;
const plz = msgFV["yes"];
const thx = msgFV["no"];
```

**Cluster**

First, if you need to set up nodes into a working redis cluster:

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1", port: 6379 });

// connect each node to form a cluster (see https://redis.io/commands/cluster-meet)
await redis.clusterMeet("127.0.0.1", 6380);
// ...

// List the nodes in the cluster
await redis.clusterNodes();
// ... 127.0.0.1:6379@16379 myself,master - 0 1593978765000 0 connected
// ... 127.0.0.1:6380@16380 master - 0 1593978766503 1 connected
```

To consume a redis cluster, you can use
[experimental/cluster module](experimental/cluster/README.md).

## Advanced Usage

### Retriable connection

By default, a client's connection will retry a command execution if the server
dies or the network becomes unavailable. You can change the maximum number of
retries by setting `maxRetryCount` (It's default to `10`):

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1", maxRetryCount: 0 }); // Disable retries
```

### Execute raw commands

`Redis.sendCommand` is low level interface for
[redis protocol](https://redis.io/topics/protocol). You can send raw redis
commands and receive replies.

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1" });

{
  const reply = await redis.sendCommand("SET", "redis", "nice");
  console.assert(reply.value() === "OK");
}

{
  const reply = await redis.sendCommand("GET", "redis");
  console.assert(reply.value() === "nice");
}
```

### Pipelining

https://redis.io/topics/pipelining

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1" });
const pl = redis.pipeline();
pl.ping();
pl.ping();
pl.set("set1", "value1");
pl.set("set2", "value2");
pl.mget("set1", "set2");
pl.del("set1");
pl.del("set2");
const replies = await pl.flush();
```

### TxPipeline (pipeline with MULTI/EXEC)

We recommend to use `tx()` instead of `multi()/exec()` for transactional
operation. `MULTI/EXEC` are potentially stateful operation so that operation's
atomicity is guaranteed but redis's state may change between MULTI and EXEC.

`WATCH` is designed for these problems. You can ignore it by using TxPipeline
because pipelined MULTI/EXEC commands are strictly executed in order at the time
and no changes will happen during execution.

See detail https://redis.io/topics/transactions

```ts
import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "127.0.0.1" });
const tx = redis.tx();
tx.set("a", "aa");
tx.set("b", "bb");
tx.del("c");
await tx.flush();
// MULTI
// SET a aa
// SET b bb
// DEL c
// EXEC
```

### Client side caching

https://redis.io/topics/client-side-caching

```typescript
import { connect } from "https://deno.land/x/redis/mod.ts";

const mainClient = await connect({ hostname: "127.0.0.1" });
const cacheClient = await connect({ hostname: "127.0.0.1" });

const cacheClientID = await cacheClient.clientID();
await mainClient.clientTracking({
  mode: "ON",
  redirect: cacheClientID,
});
const sub = await cacheClient.subscribe<string[]>("__redis__:invalidate");

(async () => {
  for await (const { channel, message } of sub.receive()) {
    // Handle invalidation messages...
  }
})();
```

### Experimental features

deno-redis provides some experimental features.

See [experimental/README.md](experimental/README.md) for details.

## Credit

This module was originally authored by
[Yusuke Sakurai](https://github.com/keroxp).
