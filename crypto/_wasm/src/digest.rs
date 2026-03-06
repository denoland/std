// Copyright 2018-2026 the Deno authors. MIT license.
use digest::{Digest, DynDigest, ExtendableOutput, Update};
use typenum::{U16, U20, U28, U32, U48};

/// Enum wrapper over all supported digest implementations.
pub enum Context {
  Blake2b(Box<blake2::Blake2b512>),
  Blake2b128(Box<blake2::Blake2b<U16>>),
  Blake2b160(Box<blake2::Blake2b<U20>>),
  Blake2b224(Box<blake2::Blake2b<U28>>),
  Blake2b256(Box<blake2::Blake2b<U32>>),
  Blake2b384(Box<blake2::Blake2b<U48>>),
  Blake2s(Box<blake2::Blake2s256>),
  Blake3(Box<blake3::Hasher>),
  Keccak224(Box<sha3::Keccak224>),
  Keccak256(Box<sha3::Keccak256>),
  Keccak384(Box<sha3::Keccak384>),
  Keccak512(Box<sha3::Keccak512>),
  Md4(Box<md4::Md4>),
  Md5(Box<md5::Md5>),
  Ripemd160(Box<ripemd::Ripemd160>),
  Sha1(Box<sha1::Sha1>),
  Sha3_224(Box<sha3::Sha3_224>),
  Sha3_256(Box<sha3::Sha3_256>),
  Sha3_384(Box<sha3::Sha3_384>),
  Sha3_512(Box<sha3::Sha3_512>),
  Sha224(Box<sha2::Sha224>),
  Sha256(Box<sha2::Sha256>),
  Sha384(Box<sha2::Sha384>),
  Sha512(Box<sha2::Sha512>),
  Shake128(Box<sha3::Shake128>),
  Shake256(Box<sha3::Shake256>),
  Tiger(Box<tiger::Tiger>),
  Fnv32(Box<crate::fnv::Fnv32>),
  Fnv32A(Box<crate::fnv::Fnv32A>),
  Fnv64(Box<crate::fnv::Fnv64>),
  Fnv64A(Box<crate::fnv::Fnv64A>),
}

use Context::*;

impl Context {
  pub fn new(algorithm_name: &str) -> Result<Context, &'static str> {
    Ok(match algorithm_name {
      "BLAKE2B" => Blake2b(Default::default()),
      "BLAKE2B-128" => Blake2b128(Default::default()),
      "BLAKE2B-160" => Blake2b160(Default::default()),
      "BLAKE2B-224" => Blake2b224(Default::default()),
      "BLAKE2B-256" => Blake2b256(Default::default()),
      "BLAKE2B-384" => Blake2b384(Default::default()),
      "BLAKE2S" => Blake2s(Default::default()),
      "BLAKE3" => Blake3(Default::default()),
      "KECCAK-224" => Keccak224(Default::default()),
      "KECCAK-256" => Keccak256(Default::default()),
      "KECCAK-384" => Keccak384(Default::default()),
      "KECCAK-512" => Keccak512(Default::default()),
      "MD4" => Md4(Default::default()),
      "MD5" => Md5(Default::default()),
      "RIPEMD-160" => Ripemd160(Default::default()),
      "SHA-1" => Sha1(Default::default()),
      "SHA3-224" => Sha3_224(Default::default()),
      "SHA3-256" => Sha3_256(Default::default()),
      "SHA3-384" => Sha3_384(Default::default()),
      "SHA3-512" => Sha3_512(Default::default()),
      "SHA-224" => Sha224(Default::default()),
      "SHA-256" => Sha256(Default::default()),
      "SHA-384" => Sha384(Default::default()),
      "SHA-512" => Sha512(Default::default()),
      "SHAKE128" => Shake128(Default::default()),
      "SHAKE256" => Shake256(Default::default()),
      "TIGER" => Tiger(Default::default()),
      "FNV32" => Fnv32(Box::new(crate::fnv::Fnv32::new())),
      "FNV32A" => Fnv32A(Box::new(crate::fnv::Fnv32A::new())),
      "FNV64" => Fnv64(Box::new(crate::fnv::Fnv64::new())),
      "FNV64A" => Fnv64A(Box::new(crate::fnv::Fnv64A::new())),
      _ => return Err("unsupported algorithm"),
    })
  }

  /// The output digest length for the algorithm, in bytes.
  ///
  /// If the algorithm is variable-length, this returns its default length.
  fn output_length(&self) -> usize {
    match self {
      Blake2b(context) => context.output_size(),
      Blake2b128(context) => context.output_size(),
      Blake2b160(context) => context.output_size(),
      Blake2b224(context) => context.output_size(),
      Blake2b256(context) => context.output_size(),
      Blake2b384(context) => context.output_size(),
      Blake2s(context) => context.output_size(),
      Blake3(context) => context.output_size(),
      Keccak224(context) => context.output_size(),
      Keccak256(context) => context.output_size(),
      Keccak384(context) => context.output_size(),
      Keccak512(context) => context.output_size(),
      Md4(context) => context.output_size(),
      Md5(context) => context.output_size(),
      Ripemd160(context) => context.output_size(),
      Sha1(context) => context.output_size(),
      Sha3_224(context) => context.output_size(),
      Sha3_256(context) => context.output_size(),
      Sha3_384(context) => context.output_size(),
      Sha3_512(context) => context.output_size(),
      Sha224(context) => context.output_size(),
      Sha256(context) => context.output_size(),
      Sha384(context) => context.output_size(),
      Sha512(context) => context.output_size(),
      Tiger(context) => context.output_size(),
      Fnv32(_) => 4,
      Fnv32A(_) => 4,
      Fnv64(_) => 8,
      Fnv64A(_) => 8,

      // https://doi.org/10.6028/NIST.FIPS.202's Table 4 indicates that in order
      // to reach the target security strength for these algorithms, the output
      // size (in bits) needs to be (at least) two times larger than that
      // security strength (in bits).
      Shake128(_) => 32, // implying a length of (2 * 128) bits = 32 bytes
      Shake256(_) => 64, // implying a length of (2 * 256) bits = 64 bytes
    }
  }

  /// Whether the algorithm has an extendable variable-length digest output
  /// (whether it is an "XOF").
  const fn extendable(&self) -> bool {
    matches!(self, Blake3(_) | Shake128(_) | Shake256(_))
  }

  pub fn update(&mut self, data: &[u8]) {
    match self {
      Blake2b(context) => Digest::update(&mut **context, data),
      Blake2b128(context) => Digest::update(&mut **context, data),
      Blake2b160(context) => Digest::update(&mut **context, data),
      Blake2b224(context) => Digest::update(&mut **context, data),
      Blake2b256(context) => Digest::update(&mut **context, data),
      Blake2b384(context) => Digest::update(&mut **context, data),
      Blake2s(context) => Digest::update(&mut **context, data),
      Blake3(context) => Digest::update(&mut **context, data),
      Keccak224(context) => Digest::update(&mut **context, data),
      Keccak256(context) => Digest::update(&mut **context, data),
      Keccak384(context) => Digest::update(&mut **context, data),
      Keccak512(context) => Digest::update(&mut **context, data),
      Md4(context) => Digest::update(&mut **context, data),
      Md5(context) => Digest::update(&mut **context, data),
      Ripemd160(context) => Digest::update(&mut **context, data),
      Sha1(context) => Digest::update(&mut **context, data),
      Sha3_224(context) => Digest::update(&mut **context, data),
      Sha3_256(context) => Digest::update(&mut **context, data),
      Sha3_384(context) => Digest::update(&mut **context, data),
      Sha3_512(context) => Digest::update(&mut **context, data),
      Sha224(context) => Digest::update(&mut **context, data),
      Sha256(context) => Digest::update(&mut **context, data),
      Sha384(context) => Digest::update(&mut **context, data),
      Sha512(context) => Digest::update(&mut **context, data),
      Tiger(context) => Digest::update(&mut **context, data),
      Shake128(context) => (&mut **context).update(data),
      Shake256(context) => (&mut **context).update(data),
      Fnv32(context) => (&mut **context).update(data),
      Fnv32A(context) => (&mut **context).update(data),
      Fnv64(context) => (&mut **context).update(data),
      Fnv64A(context) => (&mut **context).update(data),
    };
  }

  pub fn digest_and_drop(
    self,
    length: Option<usize>,
  ) -> Result<Box<[u8]>, &'static str> {
    if let Some(length) = length {
      if !self.extendable() && length != self.output_length() {
        return Err(
          "non-default length specified for non-extendable algorithm",
        );
      }
    }

    let length = length.unwrap_or_else(|| self.output_length());

    Ok(match self {
      Blake2b(context) => context.finalize(),
      Blake2b128(context) => context.finalize(),
      Blake2b160(context) => context.finalize(),
      Blake2b224(context) => context.finalize(),
      Blake2b256(context) => context.finalize(),
      Blake2b384(context) => context.finalize(),
      Blake2s(context) => context.finalize(),
      Blake3(context) => context.finalize_boxed(length),
      Keccak224(context) => context.finalize(),
      Keccak256(context) => context.finalize(),
      Keccak384(context) => context.finalize(),
      Keccak512(context) => context.finalize(),
      Md4(context) => context.finalize(),
      Md5(context) => context.finalize(),
      Ripemd160(context) => context.finalize(),
      Sha1(context) => context.finalize(),
      Sha3_224(context) => context.finalize(),
      Sha3_256(context) => context.finalize(),
      Sha3_384(context) => context.finalize(),
      Sha3_512(context) => context.finalize(),
      Sha224(context) => context.finalize(),
      Sha256(context) => context.finalize(),
      Sha384(context) => context.finalize(),
      Sha512(context) => context.finalize(),
      Tiger(context) => context.finalize(),
      Shake128(context) => context.finalize_boxed(length),
      Shake256(context) => context.finalize_boxed(length),
      Fnv32(context) => context.digest(),
      Fnv32A(context) => context.digest(),
      Fnv64(context) => context.digest(),
      Fnv64A(context) => context.digest(),
    })
  }
}
