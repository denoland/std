// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import {
  formatLogMessage,
  getMessageTypeName,
  MessageLogContext,
  MessageType,
} from "./mod.ts";

function createContext(
  category: string,
  msgType: MessageType,
): MessageLogContext {
  return {
    category,
    type: getMessageTypeName(msgType),
    filename: import.meta.url,
  };
}

Deno.test("formatLogMessage", function (): void {
  const defaultDebugCtx = createContext("default", MessageType.Debug);
  const defaultDebugMsg = formatLogMessage(
    MessageType.Debug,
    defaultDebugCtx,
    "Debug message 1",
  );
  assertEquals(defaultDebugMsg, "Debug message 1");

  const defaultInfoCtx = createContext("default", MessageType.Info);
  const defaultInfoMsg = formatLogMessage(
    MessageType.Info,
    defaultInfoCtx,
    "Info message 1",
  );
  assertEquals(defaultInfoMsg, "Info message 1");

  const usbDebugCtx = createContext("driver.usb", MessageType.Debug);
  const usbDebugMsg = formatLogMessage(
    MessageType.Debug,
    usbDebugCtx,
    "Debug message 2",
  );
  assertEquals(usbDebugMsg, "driver.usb: Debug message 2");

  const usbInfoCtx = createContext("driver.usb", MessageType.Info);
  const usbInfoMsg = formatLogMessage(
    MessageType.Info,
    usbInfoCtx,
    "Info message 2",
  );
  assertEquals(usbInfoMsg, "driver.usb: Info message 2");
});
