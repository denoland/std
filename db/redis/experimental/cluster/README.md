# experimental/cluster

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/redis/experimental/cluster/mod.ts)

This module provides a client impelementation for
[the Redis Cluster](https://redis.io/topics/cluster-tutorial).

The implementation is based on the
[antirez/redis-rb-cluster](https://github.com/antirez/redis-rb-cluster).

## Usage

```typescript
import { connect } from "https://deno.land/x/redis/experimental/cluster/mod.ts";

const cluster = await connect({
  nodes: [
    {
      hostname: "127.0.0.1",
      port: 7000,
    },
    {
      hostname: "127.0.0.1",
      port: 7001,
    },
  ],
});

await cluster.get("{foo}bar");
```
