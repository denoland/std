// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import Transform from "./transform.js";

Object.setPrototypeOf(PassThrough.prototype, Transform.prototype);
Object.setPrototypeOf(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) {
    return new PassThrough(options);
  }

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

export default PassThrough;
