// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import {
  asyncIdFields as async_id_fields,
  constants,
} from "../internal_binding/async_wrap.ts";
const { kDefaultTriggerAsyncId } = constants;

export const symbols = {
  async_id_symbol: Symbol("trigger_async_id_symbol"),
};

export function defaultTriggerAsyncIdScope(
  triggerAsyncId: number | undefined,
  block: (...arg: unknown[]) => void,
  ...args: unknown[]
) {
  if (triggerAsyncId === undefined) {
    return block.apply(null, args);
  }
  // CHECK(NumberIsSafeInteger(triggerAsyncId))
  // CHECK(triggerAsyncId > 0)
  const oldDefaultTriggerAsyncId = async_id_fields[kDefaultTriggerAsyncId];
  async_id_fields[kDefaultTriggerAsyncId] = triggerAsyncId;

  try {
    return block.apply(null, args);
  } finally {
    async_id_fields[kDefaultTriggerAsyncId] = oldDefaultTriggerAsyncId;
  }
}
