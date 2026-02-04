// Copyright 2018-2026 the Deno authors. MIT license.
const BASIS_32: u32 = 2166136261;
const PRIME_32: u32 = 16777619;

const BASIS_64: u64 = 14695981039346656037;
const PRIME_64: u64 = 1099511628211;

pub struct Fnv32 {
  state: u32,
}

impl Fnv32 {
  pub fn new() -> Fnv32 {
    Fnv32 { state: BASIS_32 }
  }

  pub fn update(&mut self, bytes: impl AsRef<[u8]>) {
    for byte in bytes.as_ref() {
      self.state = self.state.wrapping_mul(PRIME_32);
      self.state ^= u32::from(*byte);
    }
  }

  pub fn digest(&self) -> Box<[u8]> {
    Box::new(self.state.to_be_bytes())
  }
}

pub struct Fnv32A {
  state: u32,
}

impl Fnv32A {
  pub fn new() -> Fnv32A {
    Fnv32A { state: BASIS_32 }
  }

  pub fn update(&mut self, bytes: impl AsRef<[u8]>) {
    for byte in bytes.as_ref() {
      self.state ^= u32::from(*byte);
      self.state = self.state.wrapping_mul(PRIME_32);
    }
  }

  pub fn digest(&self) -> Box<[u8]> {
    Box::new(self.state.to_be_bytes())
  }
}

pub struct Fnv64 {
  state: u64,
}

impl Fnv64 {
  pub fn new() -> Fnv64 {
    Fnv64 { state: BASIS_64 }
  }

  pub fn update(&mut self, bytes: impl AsRef<[u8]>) {
    for byte in bytes.as_ref() {
      self.state = self.state.wrapping_mul(PRIME_64);
      self.state ^= u64::from(*byte);
    }
  }

  pub fn digest(&self) -> Box<[u8]> {
    Box::new(self.state.to_be_bytes())
  }
}

pub struct Fnv64A {
  state: u64,
}

impl Fnv64A {
  pub fn new() -> Fnv64A {
    Fnv64A { state: BASIS_64 }
  }

  pub fn update(&mut self, bytes: impl AsRef<[u8]>) {
    for byte in bytes.as_ref() {
      self.state ^= u64::from(*byte);
      self.state = self.state.wrapping_mul(PRIME_64);
    }
  }

  pub fn digest(&self) -> Box<[u8]> {
    Box::new(self.state.to_be_bytes())
  }
}
