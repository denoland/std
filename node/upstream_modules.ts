// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Upstream modules
const callerPath = `const callerCallsite = require("caller-callsite");
const re = /^file:/;

module.exports = () => {
  const fileUrl = callerCallsite().getFileName();
  return fileUrl.replace(re, "");
};
`;

const getCallerFile = `
const re = /^file:/;

function getCallerFile(position = 2) {
  if (position >= Error.stackTraceLimit) {
    throw new TypeError('getCallerFile(position) requires position be less then Error.stackTraceLimit but position was: \`' + position + '\` and Error.stackTraceLimit was: \`' + Error.stackTraceLimit + '\`');
  }

  const oldPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack)  => stack;
  const stack = new Error().stack;
  Error.prepareStackTrace = oldPrepareStackTrace;


  if (stack !== null && typeof stack === 'object') {
    // stack[0] holds this file
    // stack[1] holds where this function was called
    // stack[2] holds the file we're interested in
    return stack[position] ? (stack[position] as any).getFileName().replace(re, "") : undefined;
  }
};
`;

export default {
  "caller-path": callerPath,
  "get-caller-file": getCallerFile,
} as Record<string, string>;
