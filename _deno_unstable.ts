// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export type HttpClient = Deno.HttpClient;
export type UnixConnectOptions = Deno.UnixConnectOptions;
export type UnixListenOptions = Deno.UnixListenOptions;
export type DatagramConn = Deno.DatagramConn;
export type ServeHandler = Deno.ServeHandler;

export const serve = Deno.serve;
export const upgradeHttpRaw = Deno.upgradeHttpRaw;
export const addSignalListener = Deno.addSignalListener;
export const createHttpClient = Deno.createHttpClient;
export const consoleSize = Deno.consoleSize;
export const futime = Deno.futime;
export const futimeSync = Deno.futimeSync;
export const getUid = Deno.getUid;
export const hostname = Deno.hostname;
export const loadavg = Deno.loadavg;
export const osRelease = Deno.osRelease;
export const removeSignalListener = Deno.removeSignalListener;
export const setRaw = Deno.setRaw;
export const systemMemoryInfo = Deno.systemMemoryInfo;
export const utime = Deno.utime;
export const utimeSync = Deno.utimeSync;
export const networkInterfaces = Deno.networkInterfaces;
export const unrefTimer = Deno.unrefTimer;
export const connect = Deno.connect;
export const listen = Deno.listen;
export const listenDatagram = Deno.listenDatagram;

export function ListenerRef(
  listener: Deno.Listener,
  ...args: Parameters<Deno.Listener["ref"]>
): ReturnType<Deno.Listener["ref"]> {
  if (typeof listener.ref == "function") {
    return listener.ref(...args);
  } else {
    throw new TypeError("Requires --unstable");
  }
}

export function ListenerUnref(
  listener: Deno.Listener,
  ...args: Parameters<Deno.Listener["unref"]>
): ReturnType<Deno.Listener["unref"]> {
  if (typeof listener.unref == "function") {
    return listener.unref(...args);
  } else {
    throw new TypeError("Requires --unstable");
  }
}
