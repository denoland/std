# How to build

## Prerequisite

`wasm-bindgen` is required.

```sh
cargo build --target wasm32-unknown-unknown
rustup target add wasm32-wasi

# This must match the version in hash/_wasm/Cargo.lock:
cargo install -f wasm-bindgen-cli --version 0.2.74
```

## Build

```sh
deno run --allow-all build.ts
```

`wasm.js` will be generated.
