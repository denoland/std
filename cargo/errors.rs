use serde::{Deserialize, Serialize};

pub type CargoPluginResult<T> = std::result::Result<T, CargoPluginError>;

#[derive(Serialize, Deserialize)]
pub struct CargoPluginError {
  message: String,
}