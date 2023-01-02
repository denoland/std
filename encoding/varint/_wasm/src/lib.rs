// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn encode_u32(val: u32) -> Vec<u8> {
  encode_u64(val as u64)
}

#[wasm_bindgen]
pub fn encode_u64(mut val: u64) -> Vec<u8> {
  let mut buff = Vec::with_capacity(10);
  loop {
    // If MSB == 0
    if (val & !0x7F) == 0 {
      buff.push(val as u8);
      break;
    }
    buff.push((val & 0x7F | 0x80) as u8);
    val >>= 7;
  }

  buff
}

#[wasm_bindgen]
pub fn decode_u32(buff: Vec<u8>) -> u32 {
  decode_u64(buff) as u32
}

#[wasm_bindgen]
pub fn decode_u64(buff: Vec<u8>) -> u64 {
  let mut value: u64 = 0;
  let mut length = 0;
  loop {
    let byte = buff[length] as u64;
    value |= (byte & 0x7F) << (7 * length);
    length += 1;

    if byte & 0x80 != 0x80 {
      break;
    }
  }

  value
}
