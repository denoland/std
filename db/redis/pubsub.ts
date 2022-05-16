import type { CommandExecutor } from "./executor.ts";
import { InvalidStateError } from "./errors.ts";
import { readArrayReplyBody } from "./protocol/mod.ts";

type DefaultMessageType = string;
type ValidMessageType = string | string[];

export interface RedisSubscription<
  TMessage extends ValidMessageType = DefaultMessageType,
> {
  readonly isClosed: boolean;
  receive(): AsyncIterableIterator<RedisPubSubMessage<TMessage>>;
  psubscribe(...patterns: string[]): Promise<void>;
  subscribe(...channels: string[]): Promise<void>;
  punsubscribe(...patterns: string[]): Promise<void>;
  unsubscribe(...channels: string[]): Promise<void>;
  close(): void;
}

export interface RedisPubSubMessage<TMessage = DefaultMessageType> {
  pattern?: string;
  channel: string;
  message: TMessage;
}

class RedisSubscriptionImpl<
  TMessage extends ValidMessageType = DefaultMessageType,
> implements RedisSubscription<TMessage> {
  get isConnected(): boolean {
    return this.executor.connection.isConnected;
  }

  get isClosed(): boolean {
    return this.executor.connection.isClosed;
  }

  private channels = Object.create(null);
  private patterns = Object.create(null);

  constructor(private executor: CommandExecutor) {}

  async psubscribe(...patterns: string[]) {
    await this.executor.exec("PSUBSCRIBE", ...patterns);
    for (const pat of patterns) {
      this.patterns[pat] = true;
    }
  }

  async punsubscribe(...patterns: string[]) {
    await this.executor.exec("PUNSUBSCRIBE", ...patterns);
    for (const pat of patterns) {
      delete this.patterns[pat];
    }
  }

  async subscribe(...channels: string[]) {
    await this.executor.exec("SUBSCRIBE", ...channels);
    for (const chan of channels) {
      this.channels[chan] = true;
    }
  }

  async unsubscribe(...channels: string[]) {
    await this.executor.exec("UNSUBSCRIBE", ...channels);
    for (const chan of channels) {
      delete this.channels[chan];
    }
  }

  async *receive(): AsyncIterableIterator<RedisPubSubMessage<TMessage>> {
    let forceReconnect = false;
    const connection = this.executor.connection;
    while (this.isConnected) {
      try {
        let rep: [string, string, TMessage] | [
          string,
          string,
          string,
          TMessage,
        ];
        try {
          rep = (await readArrayReplyBody(connection.reader)) as [
            string,
            string,
            TMessage,
          ] | [string, string, string, TMessage];
        } catch (err) {
          if (err instanceof Deno.errors.BadResource) {
            // Connection already closed.
            connection.close();
            break;
          }
          throw err;
        }
        const ev = rep[0];

        if (ev === "message" && rep.length === 3) {
          yield {
            channel: rep[1],
            message: rep[2],
          };
        } else if (ev === "pmessage" && rep.length === 4) {
          yield {
            pattern: rep[1],
            channel: rep[2],
            message: rep[3],
          };
        }
      } catch (error) {
        if (
          error instanceof InvalidStateError ||
          error instanceof Deno.errors.BadResource
        ) {
          forceReconnect = true;
        } else throw error;
      } finally {
        if ((!this.isClosed && !this.isConnected) || forceReconnect) {
          await connection.reconnect();
          forceReconnect = false;

          if (Object.keys(this.channels).length > 0) {
            await this.subscribe(...Object.keys(this.channels));
          }
          if (Object.keys(this.patterns).length > 0) {
            await this.psubscribe(...Object.keys(this.patterns));
          }
        }
      }
    }
  }

  close() {
    this.executor.connection.close();
  }
}

export async function subscribe<
  TMessage extends ValidMessageType = DefaultMessageType,
>(
  executor: CommandExecutor,
  ...channels: string[]
): Promise<RedisSubscription<TMessage>> {
  const sub = new RedisSubscriptionImpl<TMessage>(executor);
  await sub.subscribe(...channels);
  return sub;
}

export async function psubscribe<
  TMessage extends ValidMessageType = DefaultMessageType,
>(
  executor: CommandExecutor,
  ...patterns: string[]
): Promise<RedisSubscription<TMessage>> {
  const sub = new RedisSubscriptionImpl<TMessage>(executor);
  await sub.psubscribe(...patterns);
  return sub;
}
