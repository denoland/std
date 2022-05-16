/**
 * Based on https://github.com/antirez/redis-rb-cluster which is licensed as follows:
 *
 * Copyright (C) 2013 Salvatore Sanfilippo <antirez@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { connect, create } from "../../redis.ts";
import type { RedisConnectOptions } from "../../redis.ts";
import type { CommandExecutor } from "../../executor.ts";
import type { Connection } from "../../connection.ts";
import type { Redis } from "../../redis.ts";
import type { RedisReply, RedisValue } from "../../protocol/mod.ts";
import { ErrorReplyError } from "../../errors.ts";
import { delay } from "../../../../async/delay.ts";
import calculateSlot from "../../vendor/https/cdn.skypack.dev/cluster-key-slot/lib/index.js";
import sample from "../../vendor/https/cdn.skypack.dev/lodash-es/sample.js";
import shuffle from "../../vendor/https/cdn.skypack.dev/lodash-es/shuffle.js";
import uniqBy from "../../vendor/https/cdn.skypack.dev/lodash-es/uniqBy.js";

export interface ClusterConnectOptions {
  nodes: Array<NodeOptions>;
  maxConnections?: number;
  newRedis?: (opts: RedisConnectOptions) => Promise<Redis>;
}

export interface NodeOptions {
  hostname: string;
  port?: number;
}

interface SlotMap {
  [slot: number]: ClusterNode;
}

class ClusterNode {
  readonly name: string;

  constructor(readonly hostname: string, readonly port: number) {
    this.name = `${hostname}:${port}`;
  }

  static parseIPAndPort(ipAndPort: string): ClusterNode {
    const [ip, port] = ipAndPort.split(":");
    const node = new ClusterNode(
      ip,
      parseInt(port),
    );
    return node;
  }
}

const kRedisClusterRequestTTL = 16;

class ClusterError extends Error {}

class ClusterExecutor implements CommandExecutor {
  #nodeBySlot!: SlotMap;
  #startupNodes: ClusterNode[];
  #refreshTableASAP?: boolean;
  #maxConnections: number;
  #connectionByNodeName: { [name: string]: Redis } = {};
  #newRedis: (opts: RedisConnectOptions) => Promise<Redis>;

  constructor(opts: ClusterConnectOptions) {
    this.#startupNodes = opts.nodes.map((node) =>
      new ClusterNode(node.hostname, node.port ?? 6379)
    );
    this.#maxConnections = opts.maxConnections ?? 50; // TODO(uki00a): To be honest, I'm not sure if this default value is appropriate...
    this.#newRedis = opts.newRedis ?? connect;
  }

  get connection(): Connection {
    throw new Error("Not implemented yet");
  }

  async exec(command: string, ...args: RedisValue[]): Promise<RedisReply> {
    if (this.#refreshTableASAP) {
      await this.initializeSlotsCache();
    }
    let asking = false;
    let askingNode: ClusterNode | null = null;
    let tryRandomNode = false;
    let ttl = kRedisClusterRequestTTL;
    let lastError: null | Error;
    while (ttl > 0) {
      ttl -= 1;
      const key = getKeyFromCommand(command, args);
      if (key == null) {
        throw new ClusterError(
          "No way to dispatch this command to Redis Cluster.",
        );
      }
      const slot = calculateSlot(key);
      let r: Redis;
      if (asking && askingNode) {
        r = await this.#getConnectionByNode(askingNode);
        askingNode = null;
      } else if (tryRandomNode) {
        r = await this.#getRandomConnection();
        tryRandomNode = false;
      } else {
        r = await this.#getConnectionBySlot(slot);
      }

      try {
        if (asking) {
          await r.asking();
        }
        asking = false;
        const reply = await r.sendCommand(command, ...args);
        return reply;
      } catch (err) {
        lastError = err as Error;
        if (err instanceof Deno.errors.BadResource) {
          tryRandomNode = true;
          if (ttl < kRedisClusterRequestTTL / 2) {
            await delay(100);
          }
          continue;
        } else if (err instanceof ErrorReplyError) {
          const [code, newSlot, ipAndPort] = err.message.split(/\s+/);
          if (code === "-MOVED" || code === "-ASK") {
            if (code === "-ASK") {
              asking = true;
            } else {
              // Server replied with MOVED. It's better for us to
              // ask for CLUSTER NODES the next time.
              this.#refreshTableASAP = true;
            }
            const node = ClusterNode.parseIPAndPort(ipAndPort);
            if (asking) {
              // Server replied with -ASK. We should send the next query to the redirected node.
              askingNode = node;
            } else {
              this.#nodeBySlot[parseInt(newSlot)] = node;
            }
          } else {
            throw err;
          }
        } else {
          throw err; // An unexpected error occurred.
        }
      }
    }
    throw new ClusterError(
      `Too many Cluster redirections? (last error: ${
        lastError!.message ??
          ""
      })`,
    );
  }

  close(): void {
    const nodeNames = Object.keys(this.#connectionByNodeName);
    for (const nodeName of nodeNames) {
      const conn = this.#connectionByNodeName[nodeName];
      if (conn) {
        conn.close();
        delete this.#connectionByNodeName[nodeName];
      }
    }
    this.#refreshTableASAP = true;
  }

  async initializeSlotsCache(): Promise<void> {
    for (const node of this.#startupNodes) {
      try {
        const redis = await this.#getRedisLink(node);
        try {
          const clusterSlots = await redis.clusterSlots() as Array<
            [number, number, [string, number]]
          >;
          const nodes = [] as ClusterNode[];
          const slotMap = {} as SlotMap;
          for (const [from, to, master] of clusterSlots) {
            for (let slot = from; slot <= to; slot++) {
              const [ip, port] = master;
              const node = new ClusterNode(ip, port);
              nodes.push(node);
              slotMap[slot] = node;
            }
          }
          this.#nodeBySlot = slotMap;
          await this.#populateStartupNodes(nodes);
          this.#refreshTableASAP = false;
          return;
        } finally {
          await redis.quit();
        }
      } catch (_err) {
        // TODO: Consider logging `_err` here
        continue;
      }
    }
  }

  #populateStartupNodes(nodes: ClusterNode[]) {
    for (const node of nodes) {
      this.#startupNodes.push(node);
    }

    this.#startupNodes = uniqBy(
      this.#startupNodes,
      (node: ClusterNode) => node.name,
    );
  }

  async #getRandomConnection(): Promise<Redis> {
    for (const node of shuffle(this.#startupNodes)) {
      try {
        let conn = this.#connectionByNodeName[node.name];
        if (conn) {
          const message = await conn.ping();
          if (message === "PONG") {
            return conn;
          }
        } else {
          conn = await this.#getRedisLink(node);
          try {
            const message = await conn.ping();
            if (message === "PONG") {
              await this.#closeExistingConnection();
              this.#connectionByNodeName[node.name] = conn;
              return conn;
            } else {
              await conn.quit();
            }
          } catch {
            conn.close();
          }
        }
      } catch {
        // Just try with the next node.
      }
    }
    throw new ClusterError("Can't reach a single startup node.");
  }

  #getConnectionBySlot(slot: number): Promise<Redis> {
    const node = this.#nodeBySlot[slot];
    if (node) {
      return this.#getConnectionByNode(node);
    } else {
      return this.#getRandomConnection();
    }
  }

  async #getConnectionByNode(node: ClusterNode): Promise<Redis> {
    let conn = this.#connectionByNodeName[node.name];
    if (conn) {
      return conn;
    } else {
      try {
        await this.#closeExistingConnection();
        conn = await this.#getRedisLink(node);
        this.#connectionByNodeName[node.name] = conn;
        return conn;
      } catch {
        return this.#getRandomConnection();
      }
    }
  }

  async #closeExistingConnection() {
    const nodeNames = Object.keys(this.#connectionByNodeName);
    while (nodeNames.length >= this.#maxConnections) {
      const nodeName = sample(nodeNames);
      const conn = this.#connectionByNodeName[nodeName];
      delete this.#connectionByNodeName[nodeName];
      try {
        await conn.quit();
      } catch (err) {
        console.error(err); // TODO: Improve logging
      }
    }
  }

  #getRedisLink(node: ClusterNode): Promise<Redis> {
    const { hostname, port } = node;
    return this.#newRedis({ hostname, port });
  }
}

function getKeyFromCommand(command: string, args: RedisValue[]): string | null {
  switch (command.toLowerCase()) {
    case "info":
    case "multi":
    case "exec":
    case "slaveof":
    case "config":
    case "shutdown":
      return null;
    default:
      return args[0] as string;
  }
}

/**
 * Connects to the Redis Cluster.
 *
 * @see https://redis.io/topics/cluster-tutorial
 * @see https://redis.io/topics/cluster-spec
 */
async function connectToCluster(opts: ClusterConnectOptions): Promise<Redis> {
  const executor = new ClusterExecutor(opts);
  await executor.initializeSlotsCache();
  return create(executor);
}

export { connectToCluster as connect };
