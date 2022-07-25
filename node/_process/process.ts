// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// The following are all the process APIs that don't depend on the stream module
// They have to be split this way to prevent a circular dependency

import { isWindows } from "../../_util/os.ts";
import { nextTick as _nextTick } from "../_next_tick.ts";
import { _exiting } from "./exiting.ts";
import { notImplemented } from "../_utils.ts";

/** Returns the operating system CPU architecture for which the Deno binary was compiled */
function _arch(): string {
  if (Deno.build.arch == "x86_64") {
    return "x64";
  } else if (Deno.build.arch == "aarch64") {
    return "arm64";
  } else {
    throw Error("unreachable");
  }
}

/** https://nodejs.org/api/process.html#process_process_arch */
export const arch = _arch();

/** https://nodejs.org/api/process.html#process_process_chdir_directory */
export const chdir = Deno.chdir;

/** https://nodejs.org/api/process.html#process_process_cwd */
export const cwd = Deno.cwd;

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
export const nextTick = _nextTick;

const envTarget = {};

const OBJECT_PROTO_PROP_NAMES = Object.getOwnPropertyNames(Object.prototype);

const envProxyHandlerGetter: ProxyHandler<typeof envTarget>['get'] = (_target, prop) => {
  if (typeof prop === 'symbol') {
    notImplemented(`process.env[${prop.toString()}]`);
  }

  const envValue = Deno.env.get(prop);

  if (envValue) {
    return envValue;
  }

  if (!OBJECT_PROTO_PROP_NAMES.includes(prop) && envValue === undefined) {
    return envValue;
  }

  switch(prop) {
    case 'hasOwnProperty': return (prop: PropertyKey) => {
      if (typeof prop === 'symbol' || typeof prop === 'number') {
        return false;
      }
      return Reflect.ownKeys(Deno.env.toObject()).includes(prop);
    };
    case 'valueOf': return () => {
      return Deno.env.toObject();
    };
    case 'toString': return () => Object.prototype.toString.call(envTarget);
    case 'toLocaleString': return () => Object.prototype.toString.call(envTarget);
    default: notImplemented(`process.env[${prop}]`)
  }
}
/**
 * https://nodejs.org/api/process.html#process_process_env
 * Requires env permissions
 */
export const env: Record<string, string> = new Proxy(envTarget, {
  get: envProxyHandlerGetter,
  ownKeys: () => Reflect.ownKeys(Deno.env.toObject()),
  getOwnPropertyDescriptor: (_target, name) => {
    const e = Deno.env.toObject();
    if (name in Deno.env.toObject()) {
      const o = { enumerable: true, configurable: true };
      if (typeof name === "string") {
        // @ts-ignore we do want to set it only when name is of type string
        o.value = e[name];
      }
      return o;
    }
  },
  set(_target, prop, value) {
    Deno.env.set(String(prop), String(value));
    return value;
  },
  has: (target, prop) => Reflect.ownKeys(Deno.env.toObject()).includes(prop),
});

/** https://nodejs.org/api/process.html#process_process_pid */
export const pid = Deno.pid;

/** https://nodejs.org/api/process.html#process_process_platform */
export const platform = isWindows ? "win32" : Deno.build.os;

/**
 * https://nodejs.org/api/process.html#process_process_version
 *
 * This value is hard coded to latest stable release of Node, as
 * some packages are checking it for compatibility. Previously
 * it pointed to Deno version, but that led to incompability
 * with some packages.
 */
export const version = "v16.11.1";

/**
 * https://nodejs.org/api/process.html#process_process_versions
 *
 * This value is hard coded to latest stable release of Node, as
 * some packages are checking it for compatibility. Previously
 * it contained only output of `Deno.version`, but that led to incompability
 * with some packages. Value of `v8` field is still taken from `Deno.version`.
 */
export const versions = {
  node: "16.11.1",
  uv: "1.42.0",
  zlib: "1.2.11",
  brotli: "1.0.9",
  ares: "1.17.2",
  modules: "93",
  nghttp2: "1.45.1",
  napi: "8",
  llhttp: "6.0.4",
  openssl: "1.1.1l",
  cldr: "39.0",
  icu: "69.1",
  tz: "2021a",
  unicode: "13.0",
  ...Deno.version,
};
