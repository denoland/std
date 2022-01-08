import { createRequire } from "../module.ts";

const re = /^file:/;

export default () => {
  const require = createRequire(import.meta.url);
  const callerCallsite = require("caller-callsite");
  const fileUrl = callerCallsite().getFileName();
  return fileUrl.replace(re, "");
};
