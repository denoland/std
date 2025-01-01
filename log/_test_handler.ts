// Copyright 2018-2025 the Deno authors. MIT license.
import { BaseHandler } from "./base_handler.ts";

export class TestHandler extends BaseHandler {
  messages: string[] = [];

  override log(msg: string) {
    this.messages.push(msg);
  }
}
