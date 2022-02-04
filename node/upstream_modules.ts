// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Upstream modules
const callerPath = `const callerCallsite = require("caller-callsite");
const re = /^file:/;

module.exports = () => {
  const fileUrl = callerCallsite().getFileName();
  return fileUrl.replace(re, "");
};
`;

export default {
  "caller-path": callerPath,
} as Record<string, string>;
