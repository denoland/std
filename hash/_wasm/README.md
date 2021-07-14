# How to build

## Prerequisite

Requires Rust's WASM target and the wasm-bindgen CLI.

```sh
cargo build --target wasm32-unknown-unknown
rustup target add wasm32-unknown-unknown

# This must match the version in hash/_wasm/Cargo.lock:
cargo install -f wasm-bindgen-cli --version 0.2.74
```

## Build

```sh
deno run --allow-all ./_wasm/build.ts
```

This will regenerate `./_wasm/wasm_file.ts` and `./_wasm/wasm_bindings.ts` from
the Rust source.
