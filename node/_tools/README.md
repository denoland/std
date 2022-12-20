# Node.js Compatibility Tooling

This directory contains tooling for implementing Deno's Node.js compatibility
layer.

## Updating the Streams Implementation

The Node.js streams implementation is based on the `readable-stream` module on
npm. To update the code, run the following command:

```
deno run -A --unstable node/_tools/vendor_readable_stream.ts
```

At the top of this script, there is a variable named `sourceUrl`. This is the
implementation that is downloaded, modified, and included in `node/_stream.mjs`.
To change the vendored version of `readable-stream`, update this URL.
