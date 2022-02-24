`std/_crypto_wasm` is only for internal use, such as by `std/crypto` and
`std/node/crypto`. Its interface may not be stable between releases and it
should not be imported directly.

## How to Build

### Prerequisite

Requires the wasm-bindgen CLI.

```sh
# This must match the version of wasm-bindgen in Cargo.lock:
cargo install -f wasm-bindgen-cli --version 0.2.78
```

### Build

```sh
deno run --allow-all ./_build.ts
```

This will regenerate `./crypto.mjs` and `./crypto.wasm.mjs` from the Rust
source.

### CI

If CI fails in `Verify WASM hasn't changed` step, you need to download built
artifacts from that CI run and commit them back to the PR. Visit
`https://github.com/denoland/deno_std/actions/runs/<CI_RUN_ID>#artifacts` and
click on `Artifacts` at the top of the page.
