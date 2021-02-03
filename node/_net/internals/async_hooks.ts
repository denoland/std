const async_wrap = internalBinding("async_wrap")
const { kDefaultTriggerAsyncId, kAsyncIdCounter } = async_wrap.constants
const { async_id_fields } = async_wrap

// Increment the internal id counter and return the value. Important that the
// counter increment first. Since it's done the same way in
// Environment::new_async_uid()
export function newAsyncId() {
  return ++async_id_fields[kAsyncIdCounter];
}
export function defaultTriggerAsyncIdScope(triggerAsyncId, block, ...args) {
  if (triggerAsyncId === undefined)
    return Reflect.apply(block, null, args);
  // CHECK(NumberIsSafeInteger(triggerAsyncId))
  // CHECK(triggerAsyncId > 0)
  const oldDefaultTriggerAsyncId = async_id_fields[kDefaultTriggerAsyncId];
  async_id_fields[kDefaultTriggerAsyncId] = triggerAsyncId;

  try {
    return Reflect.apply(block, null, args);
  } finally {
    async_id_fields[kDefaultTriggerAsyncId] = oldDefaultTriggerAsyncId;
  }
}

export const { async_id_symbol,
  trigger_async_id_symbol } = internalBinding('symbols');

const init_symbol = Symbol('init');
const before_symbol = Symbol('before');
const after_symbol = Symbol('after');
const destroy_symbol = Symbol('destroy');
const promise_resolve_symbol = Symbol('promiseResolve');
const { owner_symbol } = internalBinding('symbols');
export const symbols = {
    async_id_symbol, trigger_async_id_symbol,
    init_symbol, before_symbol, after_symbol, destroy_symbol,
    promise_resolve_symbol, owner_symbol
}
