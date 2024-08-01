// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { Handler } from "./handler.ts";

export class TestHandler extends Handler {
  messages: string[] = [];

  override log(msg: string) {
    this.messages.push(msg);
  }
}
