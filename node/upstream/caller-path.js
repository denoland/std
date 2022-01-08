import { createRequire } from "../module.ts";

const require = createRequire(import.meta.url);
const re = /^file:///;

export default () => {
    const callerCallsite = require('caller-callsite');
    const fileUrl = callerCallsite().getFileName();
    return fileUrl.replace(re, "");
};
