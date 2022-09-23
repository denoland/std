import {
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
  hideStackFrames,
} from "../internal/errors.ts";
import { validateInteger } from "../internal/validators.mjs";

export const validatePosition = hideStackFrames((position: unknown) => {
  if (typeof position === "number") {
    validateInteger(position, "position");
  } else if (typeof position === "bigint") {
    if (!(position >= -(2n ** 63n) && position <= 2n ** 63n - 1n)) {
      throw new ERR_OUT_OF_RANGE(
        "position",
        `>= ${-(2n ** 63n)} && <= ${2n ** 63n - 1n}`,
        position,
      );
    }
  } else {
    throw new ERR_INVALID_ARG_TYPE("position", ["integer", "bigint"], position);
  }
});

export const validateOffsetLengthRead = hideStackFrames(
  (offset: number, length: number, bufferLength: number) => {
    if (offset < 0) {
      throw new ERR_OUT_OF_RANGE("offset", ">= 0", offset);
    }
    if (length < 0) {
      throw new ERR_OUT_OF_RANGE("length", ">= 0", length);
    }
    if (offset + length > bufferLength) {
      throw new ERR_OUT_OF_RANGE(
        "length",
        `<= ${bufferLength - offset}`,
        length,
      );
    }
  },
);

export default {
  validatePosition,
  validateOffsetLengthRead,
};
