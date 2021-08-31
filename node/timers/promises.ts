import { promisify } from "../util.ts";
import timers from "../timers.ts";

export const setTimeout = promisify(timers.setTimeout),
  setImmediate = promisify(timers.setImmediate),
  setInterval = promisify(timers.setInterval);

export default {
  setTimeout,
  setImmediate,
  setInterval,
};
