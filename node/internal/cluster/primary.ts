// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import assert from "../assert.mjs";
import { fork } from "../../child_process.ts";
import path from "../../path.ts";
import EventEmitter from "../../events.ts";
import RoundRobinHandle from "./round_robin_handle.ts";
import SharedHandle from "./shared_handle.ts";
import Worker from "./worker.ts";
import { internal, sendHelper } from "./utils.ts";
import { validatePort } from "../validators.mjs";
import type {
  Cluster as ICluster,
  ClusterSettings,
  Message,
  Worker as IWorker,
  WorkerClass,
} from "./types.ts";
import process from "../../process.ts";
import { ChildProcess } from "../child_process.ts";
import type { Handle } from "../../net.ts";
import type { UDP } from "../../internal_binding/udp_wrap.ts";
import { notImplemented } from "../../_utils.ts";
import { ObjectAssign } from "../primordials.mjs";

const cluster: ICluster = new EventEmitter() as ICluster;
const intercom = new EventEmitter();
const SCHED_NONE = 1;
const SCHED_RR = 2;
const minPort = 1024;
const maxPort = 65535;

const handles = new Map();
(cluster.isWorker as boolean) = false;
(cluster.isMaster as boolean) = false;
(cluster.isPrimary as boolean) = true;
(cluster.Worker as WorkerClass) = Worker;
(cluster.workers as Record<number, IWorker>) = {};
(cluster.settings as ClusterSettings) = {};
(cluster.SCHED_NONE as number) = SCHED_NONE; // Leave it to the operating system.
(cluster.SCHED_RR as number) = SCHED_RR; // Primary distributes connections.

let ids = 0;
let debugPortOffset = 1;
let initialized = false;
const envSchedulingPolicy = process.env.NODE_CLUSTER_SCHED_POLICY;
let schedulingPolicy: number;

if (envSchedulingPolicy === "rr") {
  schedulingPolicy = SCHED_RR;
} else if (envSchedulingPolicy === "none") {
  schedulingPolicy = SCHED_NONE;
} else if (process.platform === "win32") {
  // Round-robin doesn't perform well on
  // Windows due to the way IOCP is wired up.
  schedulingPolicy = SCHED_NONE;
} else {
  schedulingPolicy = SCHED_RR;
}

cluster.schedulingPolicy = schedulingPolicy;

cluster.setupPrimary = function (options?: ClusterSettings) {
  const settings = {
    args: process.argv.slice(2),
    exec: process.argv[1],
    execArgv: process.execArgv,
    silent: false,
    ...cluster.settings,
    ...options,
  };

  // Tell V8 to write profile data for each process to a separate file.
  // Without --logfile=v8-%p.log, everything ends up in a single, unusable
  // file. (Unusable because what V8 logs are memory addresses and each
  // process has its own memory mappings.)
  if (
    settings.execArgv.some((s: string) => s.startsWith("--prof")) &&
    !settings.execArgv.some((s: string) => s.startsWith("--logfile="))
  ) {
    settings.execArgv = [...settings.execArgv, "--logfile=v8-%p.log"];
  }

  (cluster.settings as ClusterSettings) = settings;

  if (initialized === true) {
    return process.nextTick(setupSettingsNT, settings);
  }

  initialized = true;
  schedulingPolicy = cluster.schedulingPolicy; // Freeze policy.

  assert(
    schedulingPolicy === SCHED_NONE || schedulingPolicy === SCHED_RR,
    `Bad cluster.schedulingPolicy: ${schedulingPolicy}`,
  );

  process.nextTick(setupSettingsNT, settings);

  process.on("internalMessage", (message: Message) => {
    if (message.cmd !== "NODE_DEBUG_ENABLED") {
      return;
    }

    notImplemented("cluster.Cluster.prototype.setupPrimary debugProcess");
  });
};

// Deprecated alias must be same as setupPrimary
cluster.setupMaster = cluster.setupPrimary;

function setupSettingsNT(settings: ClusterSettings) {
  cluster.emit("setup", settings);
}

function createWorkerProcess(id: number, env?: Record<string, unknown>) {
  const workerEnv = ObjectAssign({}, process.env, env, {
    NODE_UNIQUE_ID: `${id}`,
  }) as InstanceType<ObjectConstructor>
    & Record<string, string | number | boolean>;
  const execArgv = [...(cluster.settings.execArgv as string[])];
  const debugArgRegex = /--inspect(?:-brk|-port)?|--debug-port/;
  const nodeOptions = process.env.NODE_OPTIONS || "";

  if (
    execArgv.some((arg) => debugArgRegex.test(arg)) ||
    debugArgRegex.test(nodeOptions)
  ) {
    let inspectPort;

    if ("inspectPort" in cluster.settings) {
      if (typeof cluster.settings.inspectPort === "function") {
        inspectPort = cluster.settings.inspectPort();
      } else {
        inspectPort = cluster.settings.inspectPort;
      }

      validatePort(inspectPort);
    } else {
      inspectPort = (process as unknown as { debugPort: number }).debugPort +
        debugPortOffset;

      if (inspectPort > maxPort) {
        inspectPort = inspectPort - maxPort + minPort - 1;
      }

      debugPortOffset++;
    }

    execArgv.push(`--inspect-port=${inspectPort}`);
  }

  return fork(cluster.settings.exec!, cluster.settings.args, {
    cwd: cluster.settings.cwd,
    env: workerEnv,
    serialization: cluster.settings.serialization,
    silent: cluster.settings.silent,
    windowsHide: cluster.settings.windowsHide,
    execArgv: execArgv,
    stdio: cluster.settings.stdio,
    gid: cluster.settings.gid,
    uid: cluster.settings.uid,
  });
}

function removeWorker(worker: IWorker) {
  assert(worker);
  delete cluster.workers![worker.id];

  if (Object.keys(cluster.workers!).length === 0) {
    assert(handles.size === 0, "Resource leak detected.");
    intercom.emit("disconnect");
  }
}

function removeHandlesForWorker(worker: IWorker) {
  assert(worker);

  handles.forEach((handle, key) => {
    if (handle.remove(worker)) handles.delete(key);
  });
}

cluster.fork = function (env) {
  cluster.setupPrimary();
  const id = ++ids;
  const workerProcess = createWorkerProcess(id, env);
  const worker = new Worker({
    id: id,
    process: workerProcess,
  });

  worker.on(
    "message",
    function (this: IWorker, message: Message, handle: Handle | UDP) {
      cluster.emit("message", this, message, handle);
    },
  );

  worker.process.once("exit", (exitCode: number, signalCode: number) => {
    /*
     * Remove the worker from the workers list only
     * if it has disconnected, otherwise we might
     * still want to access it.
     */
    if (!worker.isConnected()) {
      removeHandlesForWorker(worker);
      removeWorker(worker);
    }

    worker.exitedAfterDisconnect = !!worker.exitedAfterDisconnect;
    worker.state = "dead";
    worker.emit("exit", exitCode, signalCode);
    cluster.emit("exit", worker, exitCode, signalCode);
  });

  worker.process.once("disconnect", () => {
    /*
     * Now is a good time to remove the handles
     * associated with this worker because it is
     * not connected to the primary anymore.
     */
    removeHandlesForWorker(worker);

    /*
     * Remove the worker from the workers list only
     * if its process has exited. Otherwise, we might
     * still want to access it.
     */
    if (worker.isDead()) {
      removeWorker(worker);
    }

    worker.exitedAfterDisconnect = !!worker.exitedAfterDisconnect;
    worker.state = "disconnected";
    worker.emit("disconnect");
    cluster.emit("disconnect", worker);
  });

  worker.process.on("internalMessage", internal(worker, onmessage));
  process.nextTick(emitForkNT, worker);
  cluster.workers![worker.id] = worker;

  return worker;
};

function emitForkNT(worker: IWorker) {
  cluster.emit("fork", worker);
}

cluster.disconnect = function (cb) {
  const workers = Object.keys(cluster.workers!);

  if (workers.length === 0) {
    process.nextTick(() => intercom.emit("disconnect"));
  } else {
    for (const worker of Object.values(cluster.workers!)) {
      if (worker.isConnected()) {
        worker.disconnect();
      }
    }
  }

  if (typeof cb === "function") {
    intercom.once("disconnect", cb);
  }
};

const methodMessageMapping = {
  close,
  exitedAfterDisconnect,
  listening,
  online,
  queryServer,
};

function onmessage(this: IWorker, message: Message, _handle: Handle | UDP) {
  const fn =
    methodMessageMapping[message.act as keyof typeof methodMessageMapping];

  if (typeof fn === "function") {
    fn(this, message);
  }
}

function online(worker: IWorker) {
  worker.state = "online";
  worker.emit("online");
  cluster.emit("online", worker);
}

function exitedAfterDisconnect(worker: IWorker, message: Message) {
  worker.exitedAfterDisconnect = true;
  send(worker, { ack: message.seq });
}

function queryServer(worker: IWorker, message: Message) {
  // Stop processing if worker already disconnecting
  if (worker.exitedAfterDisconnect) {
    return;
  }

  const key = `${message.address}:${message.port}:${message.addressType}:` +
    `${message.fd}:${message.index}`;

  let handle = handles.get(key);

  if (handle === undefined) {
    let address = message.address;

    // Find shortest path for unix sockets because of the ~100 byte limit
    if (
      message.port! < 0 &&
      typeof address === "string" &&
      process.platform !== "win32"
    ) {
      address = path.relative(process.cwd(), address);

      if (message.address!.length < address.length) {
        address = message.address;
      }
    }

    // UDP is exempt from round-robin connection balancing for what should
    // be obvious reasons: it's connectionless. There is nothing to send to
    // the workers except raw datagrams and that's pointless.
    if (
      schedulingPolicy !== SCHED_RR ||
      message.addressType === "udp4" ||
      message.addressType === "udp6"
    ) {
      handle = new SharedHandle(key, address!, message);
    } else {
      handle = new RoundRobinHandle(key, address!, message);
    }

    handles.set(key, handle);
  }

  if (!handle.data) {
    handle.data = message.data;
  }

  // Set custom server data
  handle.add(
    worker,
    (
      errno: number,
      reply: Record<string, unknown> | null,
      handle: Handle | UDP,
    ) => {
      const { data } = handles.get(key);

      if (errno) {
        handles.delete(key); // Gives other workers a chance to retry.
      }

      send(
        worker,
        {
          errno,
          key,
          ack: message.seq,
          data,
          ...reply,
        },
        handle,
      );
    },
  );
}

function listening(worker: IWorker, message: Message) {
  const info = {
    addressType: message.addressType,
    address: message.address,
    port: message.port,
    fd: message.fd,
  };

  worker.state = "listening";
  worker.emit("listening", info);
  cluster.emit("listening", worker, info);
}

// Server in worker is closing, remove from list. The handle may have been
// removed by a prior call to removeHandlesForWorker() so guard against that.
function close(worker: IWorker, message: Message) {
  const key = message.key;
  const handle = handles.get(key);

  if (handle && handle.remove(worker)) {
    handles.delete(key);
  }
}

function send(
  worker: IWorker,
  message: Message,
  handle?: Handle | UDP,
  cb?: unknown,
) {
  return sendHelper(worker.process, message, handle, cb);
}

// Extend generic Worker with methods specific to the primary process.
Worker.prototype.disconnect = function (): IWorker {
  this.exitedAfterDisconnect = true;
  send(this, { act: "disconnect" });
  removeHandlesForWorker(this);
  removeWorker(this);

  return this;
};

Worker.prototype.destroy = function (signo?: string): void {
  const proc = this.process;

  signo = signo || "SIGTERM";

  if (this.isConnected()) {
    this.once("disconnect", () => (proc as ChildProcess).kill(signo));
    this.disconnect();

    return;
  }

  (proc as ChildProcess).kill(signo);
};

export default cluster;
