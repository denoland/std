// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import EventEmitter from "../../events.ts";
import { ChildProcess } from "../child_process.ts";
import { Process } from "../../process.ts";
import type { ForkOptions } from "../../child_process.ts";

export interface Message {
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

export type Serializable =
  | string
  | Record<string, unknown>
  | number
  | boolean
  | bigint;

export interface MessageOptions {
  keepOpen?: boolean | undefined;
}

export interface ClusterSettings extends ForkOptions {
  exec?: string;
  args?: string[];
  inspectPort?: number | (() => number);
}

export interface Address {
  address: string;
  port: number;
  addressType: number | "udp4" | "udp6"; // 4, 6, -1, "udp4", "udp6"
}

export interface WorkerOptions {
  id?: number;
  process?: ChildProcess | Process;
  state?: string;
}

export interface WorkerClass extends Function {
  new (options?: WorkerOptions | null): Worker;
}

export interface Worker extends EventEmitter {
  state: string;

  /**
   * Each new worker is given its own unique id, this id is stored in the`id`.
   *
   * While a worker is alive, this is the key that indexes it in`cluster.workers`.
   */
  id: number;

  /**
   * All workers are created using `child_process.fork()`, the returned object
   * from this function is stored as `.process`. In a worker, the global `process`is stored.
   *
   * See: `Child Process module`.
   *
   * Workers will call `process.exit(0)` if the `'disconnect'` event occurs
   * on `process` and `.exitedAfterDisconnect` is not `true`. This protects against
   * accidental disconnection.
   */
  process: ChildProcess | Process;

  /**
   * Send a message to a worker or primary, optionally with a handle.
   *
   * In the primary this sends a message to a specific worker. It is identical to `ChildProcess.send()`.
   *
   * In a worker this sends a message to the primary. It is identical to`process.send()`.
   *
   * This example will echo back all messages from the primary:
   *
   * ```js
   * if (cluster.isPrimary) {
   *   const worker = cluster.fork();
   *   worker.send('hi there');
   *
   * } else if (cluster.isWorker) {
   *   process.on('message', (msg) => {
   *     process.send(msg);
   *   });
   * }
   * ```
   * @param options The `options` argument, if present, is an object used to parameterize the sending of certain types of handles. `options` supports the following properties:
   */
  send(
    message: Serializable,
    callback?: (error: Error | null) => void,
  ): boolean;
  send(
    message: Serializable,
    // deno-lint-ignore no-explicit-any
    sendHandle: any,
    callback?: (error: Error | null) => void,
  ): boolean;
  send(
    message: Serializable,
    // deno-lint-ignore no-explicit-any
    sendHandle: any,
    options?: MessageOptions,
    callback?: (error: Error | null) => void,
  ): boolean;

  /**
   * This function will kill the worker. In the primary, it does this
   * by disconnecting the `worker.process`, and once disconnected, killing
   * with `signal`. In the worker, it does it by disconnecting the channel,
   * and then exiting with code `0`.
   *
   * Because `kill()` attempts to gracefully disconnect the worker process, it is
   * susceptible to waiting indefinitely for the disconnect to complete. For example,
   * if the worker enters an infinite loop, a graceful disconnect will never occur.
   * If the graceful disconnect behavior is not needed, use `worker.process.kill()`.
   *
   * Causes `.exitedAfterDisconnect` to be set.
   *
   * This method is aliased as `worker.destroy()` for backward compatibility.
   *
   * In a worker, `process.kill()` exists, but it is not this function;
   * it is `kill()`.
   * @param [signal='SIGTERM'] Name of the kill signal to send to the worker process.
   */
  kill(signal?: string): void;

  destroy(signal?: string): void;

  /**
   * In a worker, this function will close all servers, wait for the `'close'` event
   * on those servers, and then disconnect the IPC channel.
   *
   * In the primary, an internal message is sent to the worker causing it to call`.disconnect()` on itself.
   *
   * Causes `.exitedAfterDisconnect` to be set.
   *
   * After a server is closed, it will no longer accept new connections,
   * but connections may be accepted by any other listening worker. Existing
   * connections will be allowed to close as usual. When no more connections exist,
   * see `server.close()`, the IPC channel to the worker will close allowing it
   * to die gracefully.
   *
   * The above applies _only_ to server connections, client connections are not
   * automatically closed by workers, and disconnect does not wait for them to close
   * before exiting.
   *
   * In a worker, `process.disconnect` exists, but it is not this function;
   * it is `disconnect()`.
   *
   * Because long living server connections may block workers from disconnecting, it
   * may be useful to send a message, so application specific actions may be taken to
   * close them. It also may be useful to implement a timeout, killing a worker if
   * the `'disconnect'` event has not been emitted after some time.
   *
   * ```js
   * if (cluster.isPrimary) {
   *   const worker = cluster.fork();
   *   let timeout;
   *
   *   worker.on('listening', (address) => {
   *     worker.send('shutdown');
   *     worker.disconnect();
   *     timeout = setTimeout(() => {
   *       worker.kill();
   *     }, 2000);
   *   });
   *
   *   worker.on('disconnect', () => {
   *     clearTimeout(timeout);
   *   });
   *
   * } else if (cluster.isWorker) {
   *   const net = require('net');
   *   const server = net.createServer((socket) => {
   *     // Connections never end
   *   });
   *
   *   server.listen(8000);
   *
   *   process.on('message', (msg) => {
   *     if (msg === 'shutdown') {
   *       // Initiate graceful close of any connections to server
   *     }
   *   });
   * }
   * ```
   * @return A reference to `worker`.
   */
  disconnect(): void;

  /**
   * This function returns `true` if the worker is connected to its primary via its
   * IPC channel, `false` otherwise. A worker is connected to its primary after it
   * has been created. It is disconnected after the `'disconnect'` event is emitted.
   */
  isConnected(): boolean;

  /**
   * This function returns `true` if the worker's process has terminated (either
   * because of exiting or being signaled). Otherwise, it returns `false`.
   *
   * ```js
   * import cluster from 'cluster';
   * import http from 'http';
   * import { cpus } from 'os';
   * import process from 'process';
   *
   * const numCPUs = cpus().length;
   *
   * if (cluster.isPrimary) {
   *   console.log(`Primary ${process.pid} is running`);
   *
   *   // Fork workers.
   *   for (let i = 0; i < numCPUs; i++) {
   *     cluster.fork();
   *   }
   *
   *   cluster.on('fork', (worker) => {
   *     console.log('worker is dead:', worker.isDead());
   *   });
   *
   *   cluster.on('exit', (worker, code, signal) => {
   *     console.log('worker is dead:', worker.isDead());
   *   });
   * } else {
   *   // Workers can share any TCP connection. In this case, it is an HTTP server.
   *   http.createServer((req, res) => {
   *     res.writeHead(200);
   *     res.end(`Current process\n ${process.pid}`);
   *     process.kill(process.pid);
   *   }).listen(8000);
   * }
   * ```
   */
  isDead(): boolean;

  /**
   * This property is `true` if the worker exited due to `.kill()` or`.disconnect()`. If the worker exited any other way, it is `false`. If the
   * worker has not exited, it is `undefined`.
   *
   * The boolean `worker.exitedAfterDisconnect` allows distinguishing between
   * voluntary and accidental exit, the primary may choose not to respawn a worker
   * based on this value.
   *
   * ```js
   * cluster.on('exit', (worker, code, signal) => {
   *   if (worker.exitedAfterDisconnect === true) {
   *     console.log('Oh, it was just voluntary – no need to worry');
   *   }
   * });
   *
   * // kill worker
   * worker.kill();
   * ```
   */
  exitedAfterDisconnect?: boolean;

  /**
   * events.EventEmitter
   *   1. disconnect
   *   2. error
   *   3. exit
   *   4. listening
   *   5. message
   *   6. online
   */
  addListener(event: string, listener: (...args: unknown[]) => void): this;
  addListener(event: "disconnect", listener: () => void): this;
  addListener(event: "error", listener: (error: Error) => void): this;
  addListener(
    event: "exit",
    listener: (code: number, signal: string) => void,
  ): this;
  addListener(event: "listening", listener: (address: Address) => void): this;
  addListener(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  addListener(event: "online", listener: () => void): this;

  emit(event: string | symbol, ...args: unknown[]): boolean;
  emit(event: "disconnect"): boolean;
  emit(event: "error", error: Error): boolean;
  emit(event: "exit", code: number, signal: string): boolean;
  emit(event: "listening", address: Address): boolean;
  // deno-lint-ignore no-explicit-any
  emit(event: "message", message: unknown, handle: any): boolean;
  emit(event: "online"): boolean;

  on(event: string, listener: (...args: unknown[]) => void): this;
  on(event: "disconnect", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "exit", listener: (code: number, signal: string) => void): this;
  on(event: "listening", listener: (address: Address) => void): this;
  // deno-lint-ignore no-explicit-any
  on(event: "message", listener: (message: unknown, handle: any) => void): this; // the handle is a Socket or Server object, or undefined.
  on(event: "online", listener: () => void): this;

  once(event: string, listener: (...args: unknown[]) => void): this;
  once(event: "disconnect", listener: () => void): this;
  once(event: "error", listener: (error: Error) => void): this;
  once(event: "exit", listener: (code: number, signal: string) => void): this;
  once(event: "listening", listener: (address: Address) => void): this;
  once(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  once(event: "online", listener: () => void): this;

  prependListener(event: string, listener: (...args: unknown[]) => void): this;
  prependListener(event: "disconnect", listener: () => void): this;
  prependListener(event: "error", listener: (error: Error) => void): this;
  prependListener(
    event: "exit",
    listener: (code: number, signal: string) => void,
  ): this;
  prependListener(
    event: "listening",
    listener: (address: Address) => void,
  ): this;
  prependListener(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  prependListener(event: "online", listener: () => void): this;

  prependOnceListener(
    event: string,
    listener: (...args: unknown[]) => void,
  ): this;
  prependOnceListener(event: "disconnect", listener: () => void): this;
  prependOnceListener(event: "error", listener: (error: Error) => void): this;
  prependOnceListener(
    event: "exit",
    listener: (code: number, signal: string) => void,
  ): this;
  prependOnceListener(
    event: "listening",
    listener: (address: Address) => void,
  ): this;
  prependOnceListener(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  prependOnceListener(event: "online", listener: () => void): this;
}

export interface Cluster extends EventEmitter {
  readonly isPrimary: boolean;
  /** @deprecated use isPrimary. */
  readonly isMaster: boolean;
  readonly isWorker: boolean;
  readonly settings: ClusterSettings;
  readonly worker?: Worker | null;
  readonly Worker?: WorkerClass;
  readonly workers?: Record<number, Worker>;
  readonly SCHED_NONE: number;
  readonly SCHED_RR: number;

  schedulingPolicy: number;

  _setupWorker?: () => void;

  _getServer?: (
    // deno-lint-ignore no-explicit-any
    obj: any,
    options: {
      address?: string | null;
      port?: number | null;
      addressType?: string | number | null;
      fd?: number | null;
      flags?: number | null;
    },
    // deno-lint-ignore no-explicit-any
    cb: (err: number, handle: any) => void,
  ) => void;

  disconnect(callback?: () => void): void;

  fork(env?: Record<string | number, unknown>): Worker;

  /** @deprecated - use setupPrimary. */
  setupMaster(settings?: ClusterSettings): void;

  /**
   * `setupPrimary` is used to change the default 'fork' behavior. Once called, the settings will be present in cluster.settings.
   */
  setupPrimary(settings?: ClusterSettings): void;

  /**
   * events.EventEmitter
   *   1. disconnect
   *   2. exit
   *   3. fork
   *   4. listening
   *   5. message
   *   6. online
   *   7. setup
   */
  addListener(event: string, listener: (...args: unknown[]) => void): this;
  addListener(event: "disconnect", listener: (worker: Worker) => void): this;
  addListener(
    event: "exit",
    listener: (worker: Worker, code: number, signal: string) => void,
  ): this;
  addListener(event: "fork", listener: (worker: Worker) => void): this;
  addListener(
    event: "listening",
    listener: (worker: Worker, address: Address) => void,
  ): this;
  addListener(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (worker: Worker, message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  addListener(event: "online", listener: (worker: Worker) => void): this;
  addListener(
    event: "setup",
    listener: (settings: ClusterSettings) => void,
  ): this;

  emit(event: string | symbol, ...args: unknown[]): boolean;
  emit(event: "disconnect", worker: Worker): boolean;
  emit(event: "exit", worker: Worker, code: number, signal: string): boolean;
  emit(event: "fork", worker: Worker): boolean;
  emit(event: "listening", worker: Worker, address: Address): boolean;
  emit(
    event: "message",
    worker: Worker,
    message: unknown,
    // deno-lint-ignore no-explicit-any
    handle: any,
  ): boolean;
  emit(event: "online", worker: Worker): boolean;
  emit(event: "setup", settings: ClusterSettings): boolean;

  on(event: string, listener: (...args: unknown[]) => void): this;
  on(event: "disconnect", listener: (worker: Worker) => void): this;
  on(
    event: "exit",
    listener: (worker: Worker, code: number, signal: string) => void,
  ): this;
  on(event: "fork", listener: (worker: Worker) => void): this;
  on(
    event: "listening",
    listener: (worker: Worker, address: Address) => void,
  ): this;
  on(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (worker: Worker, message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  on(event: "online", listener: (worker: Worker) => void): this;
  on(event: "setup", listener: (settings: ClusterSettings) => void): this;

  once(event: string, listener: (...args: unknown[]) => void): this;
  once(event: "disconnect", listener: (worker: Worker) => void): this;
  once(
    event: "exit",
    listener: (worker: Worker, code: number, signal: string) => void,
  ): this;
  once(event: "fork", listener: (worker: Worker) => void): this;
  once(
    event: "listening",
    listener: (worker: Worker, address: Address) => void,
  ): this;
  once(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (worker: Worker, message: unknown, handle: any) => void,
  ): this; // the handle is a Socket or Server object, or undefined.
  once(event: "online", listener: (worker: Worker) => void): this;
  once(event: "setup", listener: (settings: ClusterSettings) => void): this;

  prependListener(event: string, listener: (...args: unknown[]) => void): this;
  prependListener(
    event: "disconnect",
    listener: (worker: Worker) => void,
  ): this;
  prependListener(
    event: "exit",
    listener: (worker: Worker, code: number, signal: string) => void,
  ): this;
  prependListener(event: "fork", listener: (worker: Worker) => void): this;
  prependListener(
    event: "listening",
    listener: (worker: Worker, address: Address) => void,
  ): this;
  // the handle is a Socket or Server object, or undefined.
  prependListener(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (worker: Worker, message: unknown, handle?: any) => void,
  ): this;
  prependListener(event: "online", listener: (worker: Worker) => void): this;
  prependListener(
    event: "setup",
    listener: (settings: ClusterSettings) => void,
  ): this;

  prependOnceListener(
    event: string,
    listener: (...args: unknown[]) => void,
  ): this;
  prependOnceListener(
    event: "disconnect",
    listener: (worker: Worker) => void,
  ): this;
  prependOnceListener(
    event: "exit",
    listener: (worker: Worker, code: number, signal: string) => void,
  ): this;
  prependOnceListener(event: "fork", listener: (worker: Worker) => void): this;
  prependOnceListener(
    event: "listening",
    listener: (worker: Worker, address: Address) => void,
  ): this;
  // the handle is a Socket or Server object, or undefined.
  prependOnceListener(
    event: "message",
    // deno-lint-ignore no-explicit-any
    listener: (worker: Worker, message: unknown, handle: any) => void,
  ): this;
  prependOnceListener(
    event: "online",
    listener: (worker: Worker) => void,
  ): this;
  prependOnceListener(
    event: "setup",
    listener: (settings: ClusterSettings) => void,
  ): this;
}
