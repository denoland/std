import {
  clearLine,
  clearScreenDown,
  cursorTo,
  moveCursor,
} from "./internal/readline/callbacks.js";
import { emitKeypressEvents } from "./internal/readline/emitKeypressEvents.js";

export default {
  clearLine,
  clearScreenDown,
  cursorTo,
  moveCursor,
  emitKeypressEvents,
};
