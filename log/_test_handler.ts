// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { BaseHandler } from "./base_handler.ts";

export class TestHandler extends BaseHandler {
  messages: string[] = [];

  override log(msg: string) {
    this.messages.push(msg);
  }
}
