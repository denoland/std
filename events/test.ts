import { assertEqual, test } from "./package.ts";
import { EventEmitter } from "./eventemitter.ts";

test(function testBasicEvent() {
  const emitter = new EventEmitter();
  let counter = 0;

  emitter.on("evt", () => counter++);
  emitter.emit("evt");
  assertEqual(counter, 1);
});

test(function correctEventOrder() {
  const emitter = new EventEmitter();
  let callOrder: string[] = [];

  emitter.on("evt", () => callOrder.push("listener1"));
  emitter.on("evt", () => callOrder.push("listener2"));
  emitter.on("evt", () => callOrder.push("listener3"));

  emitter.emit("evt");
  assertEqual(callOrder, ["listener1", "listener2", "listener3"]);
})

test(function prependEvent() {
  const emitter = new EventEmitter();
  let callOrder: string[] = [];

  emitter.on("evt", () => callOrder.push("listener1"));
  emitter.on("evt", () => callOrder.push("listener2"));
  emitter.prependEventListener("evt", () => callOrder.push("listener3"));

  emitter.emit("evt");
  assertEqual(callOrder, ["listener3", "listener1", "listener2"]);
});

test(function removeEventListener() {
  const emitter = new EventEmitter();
  let callRecord: string[] = [];

  const removableListener = () => callRecord.push("listener2");

  emitter.on("evt", () => callRecord.push("listener1"));
  emitter.on("evt", removableListener);

  emitter.emit("evt");

  emitter.off("evt", removableListener);

  emitter.emit("evt");
  assertEqual(callRecord, ["listener1", "listener2", "listener1"]);
});
