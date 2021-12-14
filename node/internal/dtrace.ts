// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import * as config from "../internal_binding/config.ts";
import * as dtrace from "../internal_binding/dtrace.ts";

const {
  DTRACE_HTTP_CLIENT_REQUEST = () => {},
  DTRACE_HTTP_CLIENT_RESPONSE = () => {},
  DTRACE_HTTP_SERVER_REQUEST = () => {},
  DTRACE_HTTP_SERVER_RESPONSE = () => {},
  DTRACE_NET_SERVER_CONNECTION = () => {},
  DTRACE_NET_STREAM_END = () => {},
} = (config.hasDtrace ? dtrace : {});

export {
  DTRACE_HTTP_CLIENT_REQUEST,
  DTRACE_HTTP_CLIENT_RESPONSE,
  DTRACE_HTTP_SERVER_REQUEST,
  DTRACE_HTTP_SERVER_RESPONSE,
  DTRACE_NET_SERVER_CONNECTION,
  DTRACE_NET_STREAM_END,
};
