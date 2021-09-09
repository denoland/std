import { getOptionValue } from "../_options.ts";
import { emitWarning } from "../process.ts";
import {
  AI_ADDRCONFIG,
  AI_ALL,
  AI_V4MAPPED,
} from "../internal_binding/cares_wrap.ts";
import { ERR_INVALID_ARG_VALUE } from "../_errors.ts";

export function validateHints(hints: number) {
  if ((hints & ~(AI_ADDRCONFIG | AI_ALL | AI_V4MAPPED)) !== 0) {
    throw new ERR_INVALID_ARG_VALUE("hints", hints, "is invalid");
  }
}

let invalidHostnameWarningEmitted = false;

export function emitInvalidHostnameWarning(hostname: string) {
  if (invalidHostnameWarningEmitted) {
    return;
  }

  invalidHostnameWarningEmitted = true;

  emitWarning(
    `The provided hostname "${hostname}" is not a valid ` +
      "hostname, and is supported in the dns module solely for compatibility.",
    "DeprecationWarning",
    "DEP0118",
  );
}

const dnsOrder = getOptionValue("--dns-result-order") || "ipv4first";

export function getDefaultVerbatim() {
  switch (dnsOrder) {
    case "verbatim": {
      return true;
    }
    case "ipv4first": {
      return false;
    }
    default: {
      return false;
    }
  }
}
