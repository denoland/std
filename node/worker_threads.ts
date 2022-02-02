// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { notImplemented } from "./_utils.ts";

export function getEnvironmentData() {
  notImplemented();
}
export const isMainThread = undefined;
export function markAsUntransferable() {
  notImplemented();
}
export function moveMessagePortToContext() {
  notImplemented();
}
export const parentPort = undefined;
export function receiveMessageOnPort() {
  notImplemented();
}
export const resourceLimits = undefined;
export const SHARE_ENV = undefined;
export function setEnvironmentData() {
  notImplemented();
}
export const threadId = undefined;
export const workerData = undefined;
export class BroadcastChannel {
  constructor() {
    notImplemented();
  }
}
export class MessageChannel {
  constructor() {
    notImplemented();
  }
}
export class MessagePort {
  constructor() {
    notImplemented();
  }
}
export class Worker {
  constructor() {
    notImplemented();
  }
}
export default {
  getEnvironmentData,
  isMainThread,
  markAsUntransferable,
  moveMessagePortToContext,
  parentPort,
  receiveMessageOnPort,
  resourceLimits,
  SHARE_ENV,
  setEnvironmentData,
  threadId,
  workerData,
  BroadcastChannel,
  MessageChannel,
  MessagePort,
  Worker,
};
