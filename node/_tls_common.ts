// Copyright 2022 Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

export function createSecureContext(options) {
  return {
    ca: options?.ca,
    cert: options?.cert,
    key: options?.key,
  };
}

export default {
  createSecureContext,
};
