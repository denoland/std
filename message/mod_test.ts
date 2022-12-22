// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import {
  MessageCategory,
  MessageContext,
  MessageHandler,
  MessageLevel,
  setMessageHandler,
} from "./mod.ts";

interface LevelCase {
  level: MessageLevel;
  messages: string[];
  expected: string[];
}

Deno.test("setMessageHandler", function (): void {
  const usb = new MessageCategory("driver.usb");
  const usbMessages: string[] = [];
  const usbMessageHandler: MessageHandler = (
    msg: string,
    _context: MessageContext,
  ) => {
    usbMessages.push(msg);
  };
  setMessageHandler(usbMessageHandler);
  usb.log("Log 1");
  usb.info("Info 2");
  usb.warn("Warn 3");
  usb.error("Error 4");
  assertEquals(usbMessages, ["Log 1", "Info 2", "Warn 3", "Error 4"]);
});

Deno.test("Only print certain categories", function (): void {
  const usb = new MessageCategory("driver.usb");
  const gpu = new MessageCategory("driver.gpu");
  const messages: string[] = [];
  const messageHandler: MessageHandler = (
    msg: string,
    context: MessageContext,
  ) => {
    if (context.category.name === "driver.usb") {
      messages.push(msg);
    }
  };
  setMessageHandler(messageHandler);
  usb.log("Log");
  gpu.info("Info");
  usb.warn("Warn");
  gpu.error("Error");
  assertEquals(messages, ["Log", "Warn"]);
});

Deno.test("Only print certain levels", function (): void {
  const cases: LevelCase[] = [
    {
      level: "log",
      messages: [
        "log-test",
        "info-test",
        "warning-test",
        "error-test",
      ],
      expected: ["log-test"],
    },
    {
      level: "info",
      messages: [
        "log-test",
        "info-test",
        "warning-test",
        "error-test",
      ],
      expected: ["info-test"],
    },
    {
      level: "warn",
      messages: [
        "log-test",
        "info-test",
        "warning-test",
        "error-test",
      ],
      expected: ["warning-test"],
    },
    {
      level: "error",
      messages: [
        "log-test",
        "info-test",
        "warning-test",
        "error-test",
      ],
      expected: ["error-test"],
    },
  ];
  for (const { level, messages, expected } of cases) {
    const usb = new MessageCategory("driver.usb");
    const usbMessages: string[] = [];
    const messageHandler: MessageHandler = (
      msg: string,
      context: MessageContext,
    ) => {
      if (context.level === level) {
        usbMessages.push(msg);
      }
    };
    setMessageHandler(messageHandler);
    usb.log(messages[0]);
    usb.info(messages[1]);
    usb.warn(messages[2]);
    usb.error(messages[3]);
    assertEquals(usbMessages, expected);
  }
});
