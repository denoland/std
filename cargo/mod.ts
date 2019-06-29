// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// TODO(afinch7) maybe make fields camelcase here and deal with the warnings in
// rust.
/* eslint-disable @typescript-eslint/camelcase */

const { openPlugin, env } = Deno;

export interface CargoArtifact {
  output_name: string;
  is_lib: boolean;
  is_dylib: boolean;
  is_cdylib: boolean;
}

export enum CargoBuildVerbose {
  Standard = 0,
  Verbose = 1,
  VeryVerbose = 2
}

export interface CargoBuildAllOptions {
  manifest_path: string;
  lib_only: boolean;
  verbose: CargoBuildVerbose;
}

export const defaultCargoBuildOptions = {
  lib_only: true,
  verbose: CargoBuildVerbose.Standard
};

export type CargoBuildOptions = Omit<
  CargoBuildAllOptions,
  keyof typeof defaultCargoBuildOptions
>;

export interface CargoBuildResData {
  output_root: string;
  artifacts: CargoArtifact[];
}

export interface CargoBuildResError {
    message: string;
}

export interface CargoBuildRes {
    data?: CargoBuildResData;
    error?: CargoBuildResError;
}

// TODO(afinch7) make DENO_CARGO_PLUGIN_PATH optional once we can load plugins via url
// and add default url to use here.
const plugin = openPlugin(env().DENO_CARGO_PLUGIN_PATH);
const cargoBuildOp = plugin.loadOp("cargo_build");

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function build(opts: CargoBuildOptions): CargoBuildResData {
    const response = cargoBuildOp.dispatch(
        textEncoder.encode(
          JSON.stringify({
            ...defaultCargoBuildOptions,
            ...opts
          })
        )
    );
    if (response instanceof Uint8Array) {
        const result: CargoBuildRes = JSON.parse(
            textDecoder.decode(
                response,
            )
        );
        if (result.error) {
            throw new Error(result.error.message);
        } else {
            if (result.data) {
                return result.data;
            } else {
                throw new Error("Unexpected empty data field in response");
            }
        }
    } else {
        throw new Error(`Unexpected response type ${typeof response}`);
    }
}
