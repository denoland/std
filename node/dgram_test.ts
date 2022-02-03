// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertThrows } from "../testing/asserts.ts";
import * as dgram from "./dgram.ts";

Deno.test("[node/dgram] dgram not yet implemented", () => {
  const client = dgram.createSocket("udp4");

  assertThrows(
    () => {
      client.bind();
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      client.send("message");
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      client.close();
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      client.address();
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      client.connect(8000);
    },
    Error,
    "Not implemented",
  );
  assertThrows(
    () => {
      client.disconnect();
    },
    Error,
    "Not implemented",
  );
});
