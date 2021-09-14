// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/uv.cc
// - https://github.com/nodejs/node/blob/master/deps/uv
//
// See also: http://docs.libuv.org/en/v1.x/errors.html#error-constants

// REF: https://github.com/nodejs/node/blob/master/deps/uv/include/uv/errno.h
export const UV_EAI_NODATA = -3007;
export const UV_EAI_NONAME = -3008;
export const UV_ENOTCONN = -4053;
export const UV_EINVAL = -4071;
export const UV_EADDRINUSE = -4091;
export const UV_EOF = -4095;

// REF: https://github.com/nodejs/node/blob/master/deps/uv/include/uv.h#L70
export const errmap = new Map([
  [UV_EAI_NODATA, ["UV_EAI_NODATA", "no address"]],
  [UV_EAI_NONAME, ["UV_EAI_NONAME", "unknown node or service"]],
  [UV_ENOTCONN, ["UV_ENOTCONN", "socket is not connected"]],
  [UV_EINVAL, ["UV_EINVAL", "invalid argument"]],
  [UV_EADDRINUSE, ["UV_EADDRINUSE", "address already in use"]],
  [UV_EOF, ["UV_EOF", "end of file"]],
]);
