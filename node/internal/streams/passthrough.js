// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

const {
  ObjectSetPrototypeOf,
} = primordials;

module.exports = PassThrough;

const Transform = require("internal/streams/transform");
ObjectSetPrototypeOf(PassThrough.prototype, Transform.prototype);
ObjectSetPrototypeOf(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) {
    return new PassThrough(options);
  }

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
