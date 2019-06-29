use deno::CoreOp;
use deno::Op;
use deno::OpResult;
use deno::PinnedBuf;
use serde::{Deserialize, Serialize};
use serde_json;
use std::path::{PathBuf};
use cargo::ops::compile;
use cargo::ops::CompileOptions;
use cargo::util::homedir;
use cargo::util::config::Config;
use cargo::core::Workspace;
use cargo::core::SourceId;
use cargo::core::shell::Shell;
use cargo::core::manifest::Target;
use cargo::core::manifest::EitherManifest;
use cargo::core::compiler::CompileMode;
use cargo::core::compiler::Compilation;
use cargo::util::toml::read_manifest;
use url::Url;

#[macro_use]
extern crate deno;

mod errors;

use errors::CargoPluginError;
use errors::CargoPluginResult;

pub fn op_cargo_build(
    data: &[u8],
    zero_copy: Option<PinnedBuf>,
) -> CoreOp {

    let op = |data: &[u8], _zero_copy: Option<PinnedBuf>| -> OpResult<CargoPluginError> {
        let data_str = std::str::from_utf8(&data[..]).unwrap();
        let build_config = BuildConfig::from_json(data_str);
        let build_result = run_cargo_build(build_config)?;
        let result = BuildResult {
            data: Some(build_result),
            error: None,
        };
        let result_json = serde_json::to_string(&result).unwrap();
        Ok(Op::Sync(result_json.as_bytes().into()))
    };
    
    match op(data, zero_copy) {
        Ok(Op::Sync(buf)) => Op::Sync(buf),
        Ok(Op::Async(_)) => panic!("Async response not supported!"),
        Err(err) => {
            let result = BuildResult {
                error: Some(err),
                data: None,
            };
            let result_json = serde_json::to_string(&result).unwrap();
            Op::Sync(result_json.as_bytes().into())
        }
    }
}

declare_plugin_op!(cargo_build, op_cargo_build);

#[derive(Serialize, Deserialize)]
struct BuildConfigRaw {
    manifest_path: String,
    lib_only: bool,
    verbose: usize,
}

struct BuildConfig {
    pub manifest_path: PathBuf,
    pub lib_only: bool,
    pub verbose: usize,
}

impl BuildConfig {
    fn from_json(json: &str) -> Self {
        let json_value: BuildConfigRaw = serde_json::from_str(json).unwrap();
        Self {
            manifest_path: Url::parse(&json_value.manifest_path).unwrap().to_file_path().unwrap(),
            lib_only: json_value.lib_only,
            verbose: json_value.verbose,
        }
    }
}

#[derive(Serialize, Deserialize)]
struct BuildArtifact {
    pub output_name: String,
    pub is_lib: bool,
    pub is_dylib: bool,
    pub is_cdylib: bool,
}

impl BuildArtifact {
    fn from_target(target: &Target) -> Self {
        Self {
            output_name: target.crate_name(),
            is_lib: target.is_lib(),
            is_dylib: target.is_dylib(),
            is_cdylib: target.is_cdylib(),
        }
    }
}

#[derive(Serialize, Deserialize)]
struct BuildResultData {
    pub output_root: String,
    pub artifacts: Vec<BuildArtifact>,
}

impl BuildResultData {
    fn from_build_result(result: Compilation) -> Self {
        Self {
            output_root: result.root_output.to_str().unwrap().to_string(),
            artifacts: Vec::new(),
        }
    }
}

#[derive(Serialize, Deserialize)]
struct BuildResult {
    pub error: Option<CargoPluginError>,
    pub data: Option<BuildResultData>,
}

fn run_cargo_build(config: BuildConfig) -> CargoPluginResult<BuildResultData> {
    // TODO(afinch7) configure build with data from BuildConfig
    let manifest_path: PathBuf = config.manifest_path.into();
    let mut plugin_wd = manifest_path.clone();
    plugin_wd.pop();
    let shell = Shell::new();
    let home_dir = homedir(&plugin_wd).unwrap();

    let config = Config::new(shell, plugin_wd.clone(), home_dir);
    let manifest = read_manifest(&manifest_path, SourceId::for_directory(&plugin_wd).unwrap(), &config).unwrap();
    let manifest = match manifest.0 {
        EitherManifest::Real(man) => man,
        _ => unimplemented!(),
    };
    let ws = Workspace::new(&manifest_path, &config).unwrap();

    let mut compile_opts = CompileOptions::new(&ws.config(), CompileMode::Build).unwrap();
    compile_opts.build_config.release = true;

    let compile_result = compile(&ws, &compile_opts).unwrap();

    let mut build_result = BuildResultData::from_build_result(compile_result);
    for target in manifest.targets() {
        let artifact = BuildArtifact::from_target(target);
        build_result.artifacts.push(artifact);
    }
    Ok(build_result)
}